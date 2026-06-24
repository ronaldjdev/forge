#!/usr/bin/env node

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
import { buildGraph } from "./graph.mjs";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const FEATURES = join(SRC, "features");

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

export async function buildContext(projectRoot = ROOT) {
  const root = projectRoot;
  const src = join(root, "src");

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
  const graph = buildGraph(root);

  const hasFeatures = migratedFeatures.length > 0;
  const hasLegacy = legacyFeatures.length > 0;

  return {
    projectName: basename(root),
    framework,
    runtime: `Node ${process.version}`,
    database,
    orm,
    diStrategy,
    tsconfig: {
      experimentalDecorators: hasDecorators,
      emitDecoratorMetadata: hasDecoratorMetadata,
    },
    features: {
      migrated: migratedFeatures,
      legacy: legacyFeatures,
      total: migratedFeatures.length + legacyFeatures.length,
    },
    hasSrc: isDir(src),
    hasFeaturesDir: isDir(join(src, "features")),
    isMigrating: hasLegacy && hasFeatures,
    isFullyMigrated: hasFeatures && !hasLegacy,
    isLegacy: hasLegacy && !hasFeatures,
    isGreenfield: !hasLegacy && !hasFeatures && isDir(src),
    graph,
    dependencies: {},
  };
}

async function main() {
  const ctx = await buildContext();
  console.log(JSON.stringify(ctx, null, 2));
}

if (process.argv[1] && (process.argv[1].endsWith("context.mjs") || process.argv[1].endsWith("context.js"))) {
  main().catch(console.error);
}
