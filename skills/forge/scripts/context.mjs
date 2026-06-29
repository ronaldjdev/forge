#!/usr/bin/env node

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, basename, resolve } from "path";
import { getGraph } from "./graph.mjs";
import { buildOwnershipReport } from "./armorer.mjs";
import { saveCache, loadCache } from "./forge-config.mjs";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const FEATURES = join(SRC, "features");

export const PLATFORM_KNOWN = ["config", "database", "http", "server", "logger", "cache", "security", "events", "scheduler", "observability", "di"];
export const SHARED_KNOWN = ["errors", "contracts", "types", "utils", "helpers", "constants", "enums"];
export const INFRA_KNOWN = ["prisma", "mongodb", "postgres", "redis", "mail", "s3", "cloudinary", "stripe", "sqs", "rabbitmq", "kafka", "smtp"];

function read(path) {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

function exists(path) {
  return existsSync(path);
}

function isDir(path) {
  return existsSync(path) && statSync(path).isDirectory();
}

function listDir(path) {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
}

function detectFramework(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps["@nestjs/core"]) return "NestJS";
  if (deps.fastify) return "Fastify";
  if (deps.express) return "Express";
  return "unknown";
}

function detectDatabase(pkg) {
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  if (deps.some((d) => d.includes("mongodb") || d === "mongoose")) return "MongoDB";
  if (deps.includes("pg") || deps.includes("postgres")) return "PostgreSQL";
  if (deps.includes("mysql") || deps.includes("mysql2")) return "MySQL";
  if (deps.includes("sqlite3") || deps.includes("better-sqlite3")) return "SQLite";
  return "unknown";
}

function detectOrm(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps.mongoose) return "Mongoose";
  if (deps["@prisma/client"] || deps.prisma) return "Prisma";
  if (deps["typeorm"]) return "TypeORM";
  if (deps["drizzle-orm"]) return "Drizzle";
  if (deps["pg"] || deps["mysql2"]) return "native";
  return "none";
}

function detectDI(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps["tsyringe"]) return "tsyringe";
  if (deps["@nestjs/core"]) return "framework";
  if (deps["typedi"]) return "typedi";
  if (deps["awilix"]) return "awilix";
  return "manual";
}

function detectFeatures() {
  if (!isDir(FEATURES)) return [];
  return listDir(FEATURES).filter((f) => isDir(join(FEATURES, f)));
}

function detectLegacyFeatures() {
  const legacy = [];
  const ucBase = join(SRC, "application", "use-cases");
  const ctrlDir = join(SRC, "adapters", "in", "http", "controllers");

  const seen = new Set();
  for (const sub of listDir(ucBase)) {
    if (isDir(join(ucBase, sub))) {
      legacy.push(sub);
      seen.add(sub);
    }
  }
  for (const file of listDir(ctrlDir)) {
    const m = file.match(/^(.+)\.controller\.(ts|js)$/);
    if (m && !seen.has(m[1])) {
      legacy.push(m[1]);
      seen.add(m[1]);
    }
  }

  return legacy;
}

function classifyComponents(components, knownList) {
  const known = components.filter((c) => knownList.includes(c.replace(/\.(ts|js)$/, "")));
  const unknown = components.filter((c) => !knownList.includes(c.replace(/\.(ts|js)$/, "")));
  return { components, exists: components.length > 0, known, unknown };
}

function stripJsonComments(raw) {
  const lines = raw.split("\n");
  const out = [];
  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("/*") && trimmed.endsWith("*/")) continue;
    const slashSlash = trimmed.indexOf("//");
    if (slashSlash === 0) continue;
    const ci = line.indexOf("/*");
    if (ci > 0 && line.slice(ci).trim().endsWith("*/")) {
      out.push(line.slice(0, ci));
      continue;
    }
    out.push(line);
  }
  return out.join("\n").replace(/,\s*([}\]])/g, "$1");
}

function readJson(path) {
  const raw = read(path);
  if (!raw) return null;
  try {
    return JSON.parse(stripJsonComments(raw));
  } catch {
    return null;
  }
}

// ── Monorepo detection (D2) ──

function resolveGlob(pattern, base) {
  // Simple glob: supports * (single dir) and ** (recursive)
  // Not full glob but enough for pnpm-workspace.yaml patterns like "packages/*"
  if (!pattern) return [];
  const starStar = pattern.includes("**");
  const star = pattern.includes("*") && !starStar;
  const baseDir = join(base, pattern.split("*")[0].replace(/\/+$/, ""));
  if (!existsSync(baseDir)) return [];

  const results = [];
  if (star) {
    for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const pkgPath = join(baseDir, entry.name);
        if (existsSync(join(pkgPath, "package.json"))) results.push(pkgPath);
      }
    }
  } else if (starStar) {
    function walk(dir) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
          const sub = join(dir, entry.name);
          if (existsSync(join(sub, "package.json"))) results.push(sub);
          walk(sub);
        }
      }
    }
    walk(baseDir);
  }
  return results;
}

export function detectMonorepo(projectRoot = ROOT) {
  const configs = [];

  // pnpm-workspace.yaml — must have packages: key
  const pnpmWorkspace = join(projectRoot, "pnpm-workspace.yaml");
  if (existsSync(pnpmWorkspace)) {
    const content = readFileSync(pnpmWorkspace, "utf-8");
    if (content.includes("packages:")) {
      configs.push({ type: "pnpm", file: "pnpm-workspace.yaml" });
    }
  }

  // turbo.json
  if (existsSync(join(projectRoot, "turbo.json"))) {
    configs.push({ type: "turbo", file: "turbo.json" });
  }

  // nx.json
  if (existsSync(join(projectRoot, "nx.json"))) {
    configs.push({ type: "nx", file: "nx.json" });
  }

  // package.json workspaces
  const pkg = readJson(join(projectRoot, "package.json"));
  if (pkg?.workspaces) {
    const patterns = Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages || [];
    if (patterns.length > 0) {
      configs.push({ type: "npm", file: "package.json" });
    }
  }

  // Lerna
  if (existsSync(join(projectRoot, "lerna.json"))) {
    configs.push({ type: "lerna", file: "lerna.json" });
  }

  return configs;
}

export function detectWorkspaces(projectRoot = ROOT) {
  const workspaces = [];
  const pkg = readJson(join(projectRoot, "package.json"));

  // 1. pnpm-workspace.yaml
  const pnpmYaml = join(projectRoot, "pnpm-workspace.yaml");
  if (existsSync(pnpmYaml)) {
    const content = readFileSync(pnpmYaml, "utf-8");
    const lines = content.split("\n");
    let inPackages = false;
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith("packages:")) { inPackages = true; continue; }
      if (inPackages && line.startsWith("-")) {
        const pattern = line.replace(/^-\s*['"]?|['"]?\s*$/g, "").trim();
        if (pattern) {
          const resolved = resolveGlob(pattern, projectRoot);
          workspaces.push(...resolved);
        }
      }
      if (inPackages && line.startsWith("#")) continue;
      if (inPackages && !line.startsWith("-") && line !== "") inPackages = false;
    }
  }

  // 2. package.json workspaces
  if (pkg?.workspaces) {
    const patterns = Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages || [];
    for (const pattern of patterns) {
      const resolved = resolveGlob(pattern, projectRoot);
      workspaces.push(...resolved);
    }
  }

  // Deduplicate
  const seen = new Set();
  return workspaces.filter(w => {
    if (seen.has(w)) return false;
    seen.add(w);
    return true;
  }).map(w => ({
    path: w,
    name: basename(w),
    hasSrc: existsSync(join(w, "src")),
    hasFeatures: existsSync(join(w, "src", "features")),
  }));
}

export async function buildContext(projectRoot = ROOT, workspaceScope = null, opts = {}) {
  const { force = false } = opts;
  const root = workspaceScope || projectRoot;
  const src = join(root, "src");

  // Try cache first
  if (!force) {
    const cached = loadCache("context", root);
    if (cached.valid && cached.data) {
      // Ensure graph is loaded (it may be separate cache entry)
      if (!cached.data.graph) {
        const graphCached = getGraph(root, { force: false });
        cached.data.graph = graphCached;
      }
      return cached.data;
    }
  }

  const pkg = readJson(join(root, "package.json")) || {};
  const tsconfig = readJson(join(root, "tsconfig.json"));

  const framework = detectFramework(pkg);
  const database = detectDatabase(pkg);
  const orm = detectOrm(pkg);
  const diStrategy = detectDI(pkg);

  const hasDecorators =
    tsconfig?.compilerOptions?.experimentalDecorators === true;
  const hasDecoratorMetadata =
    tsconfig?.compilerOptions?.emitDecoratorMetadata === true;

  const migratedFeatures = detectFeatures();
  const legacyFeatures = detectLegacyFeatures();
  const ownership = buildOwnershipReport(root);
  const platform = classifyComponents(ownership.ownership.platform, PLATFORM_KNOWN);
  const shared = classifyComponents(ownership.ownership.shared, SHARED_KNOWN);
  const infra = classifyComponents(ownership.ownership.infra, INFRA_KNOWN);
  const orphans = ownership.orphans;
  const graph = getGraph(root, { force });

  const hasFeatures = migratedFeatures.length > 0;
  const hasLegacy = legacyFeatures.length > 0;

  // Monorepo detection
  const isRoot = root === projectRoot;
  const monorepo = isRoot ? detectMonorepo(projectRoot) : null;
  const workspaces = isRoot ? detectWorkspaces(projectRoot) : [];

  const ctx = {
    projectName: basename(root),
    isWorkspace: !isRoot,
    workspaceScope: isRoot ? null : basename(root),
    framework,
    runtime: `Node ${process.version}`,
    database,
    orm,
    diStrategy,
    tsconfig: {
      experimentalDecorators: hasDecorators,
      emitDecoratorMetadata: hasDecoratorMetadata,
    },
    platform,
    shared,
    infra,
    features: {
      migrated: migratedFeatures,
      legacy: legacyFeatures,
      total: migratedFeatures.length + legacyFeatures.length,
    },
    orphans,
    ownership,
    hasSrc: isDir(src),
    hasFeaturesDir: isDir(join(src, "features")),
    hasPlatformDir: platform.exists,
    hasSharedDir: shared.exists,
    hasInfraDir: infra.exists,
    isMigrating: hasLegacy && hasFeatures,
    isFullyMigrated: hasFeatures && !hasLegacy,
    isLegacy: hasLegacy && !hasFeatures,
    isGreenfield: !hasLegacy && !hasFeatures && isDir(src),
    // Monorepo
    monorepo,
    workspaces,
    isMonorepo: monorepo !== null && monorepo.length > 0,
    graph,
    dependencies: {},
  };

  // Save to cache
  saveCache("context", ctx, root);

  return ctx;
}

async function main() {
  const ctx = await buildContext();
  console.log(JSON.stringify(ctx, null, 2));
}

if (process.argv[1] && (process.argv[1].endsWith("context.mjs") || process.argv[1].endsWith("context.js"))) {
  main().catch(console.error);
}
