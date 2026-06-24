#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, readdirSync, statSync, renameSync } from "fs";
import { join } from "path";
import { buildContext } from "./context.mjs";
import { detectProfile } from "./profile.mjs";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

function isDir(path) {
  try { return existsSync(path) && statSync(path).isDirectory(); }
  catch { return false; }
}

function listDir(path) {
  try { return readdirSync(path).filter(e => isDir(join(path, e))); }
  catch { return []; }
}

function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
    return true;
  }
  return false;
}

function writeIndex(path, content = "") {
  const indexFile = join(path, "index.ts");
  if (!existsSync(indexFile)) {
    writeFileSync(indexFile, content, "utf-8");
  }
}

const PLATFORM_COMPONENTS = {
  config: 'export * from "./config";\n',
  database: 'export * from "./database";\n',
  http: 'export * from "./http";\n',
  server: 'export * from "./server";\n',
  logger: 'export * from "./logger";\n',
  cache: 'export * from "./cache";\n',
  security: 'export * from "./security";\n',
  events: 'export * from "./events";\n',
  scheduler: 'export * from "./scheduler";\n',
  observability: 'export * from "./observability";\n',
  di: 'export * from "./di";\n',
};

const SHARED_COMPONENTS = {
  errors: 'export * from "./errors";\n',
  contracts: 'export * from "./contracts";\n',
  types: 'export * from "./types";\n',
  utils: 'export * from "./utils";\n',
};

function getProfileComponents(profile) {
  const base = ["config", "server", "logger", "di"];

  if (profile.includes("express") || profile.includes("fastify") || profile.includes("nestjs")) {
    base.push("http");
  }

  if (profile.includes("prisma") || profile.includes("mongodb") || profile.includes("postgres") || profile.includes("pg")) {
    base.push("database");
  }

  if (profile.includes("redis")) {
    base.push("cache");
  }

  return [...new Set(base)];
}

export async function bootstrapPlatform(projectRoot = ROOT) {
  const src = join(projectRoot, "src");
  const ctx = await buildContext(projectRoot);
  const profile = detectProfile(ctx);
  const created = { platform: [], shared: [], infra: [] };

  /* ── 1. Ensure src/ exists ── */
  ensureDir(src);

  /* ── 2. Platform Layer ── */
  const platformDir = join(src, "platform");
  const wasCreated = ensureDir(platformDir);

  const profileComps = getProfileComponents(profile);
  for (const comp of profileComps) {
    const compDir = join(platformDir, comp);
    if (ensureDir(compDir)) {
      writeIndex(compDir, `// ${comp} — Platform Component\n`);
      created.platform.push(comp);
    }
  }

  if (wasCreated || created.platform.length > 0) {
    writeIndex(platformDir);
  }

  /* ── 3. Shared Layer ── */
  const sharedDir = join(src, "shared");
  if (ensureDir(sharedDir)) {
    for (const [comp, content] of Object.entries(SHARED_COMPONENTS)) {
      const compDir = join(sharedDir, comp);
      if (ensureDir(compDir)) {
        writeIndex(compDir, `// ${comp} — Shared Component\n`);
        created.shared.push(comp);
      }
    }
    writeIndex(sharedDir);
  }

  /* ── 4. Infra Layer ── */
  const infraDir = join(src, "infra");
  if (ensureDir(infraDir)) {
    if (profile.includes("prisma")) {
      const prismaDir = join(infraDir, "prisma");
      if (ensureDir(prismaDir)) {
        writeIndex(prismaDir, "// Prisma — ORM\n");
        created.infra.push("prisma");
      }
    }
    if (profile.includes("mongodb") || profile.includes("mongoose")) {
      const mongoDir = join(infraDir, "mongodb");
      if (ensureDir(mongoDir)) {
        writeIndex(mongoDir, "// MongoDB — Database\n");
        created.infra.push("mongodb");
      }
    }
    if (profile.includes("redis")) {
      const redisDir = join(infraDir, "redis");
      if (ensureDir(redisDir)) {
        writeIndex(redisDir, "// Redis — Cache/Queue\n");
        created.infra.push("redis");
      }
    }
    writeIndex(infraDir);
  }

  /* ── 5. Organize existing orphan dirs ── */
  const orphanDirs = listDir(src).filter(d =>
    !["platform", "features", "shared", "infra", "infrastructure", "core", "lib", "adapters", "application", "domain", "setting"].includes(d)
    && !d.startsWith(".")
  );

  for (const dir of orphanDirs) {
    const srcPath = join(src, dir);
    if (!isDir(srcPath)) continue;

    const lower = dir.toLowerCase();
    let target = null;

    if (["config", "database", "http", "server", "logger", "cache", "security", "events", "di", "middleware"].includes(lower)) {
      target = join(platformDir, lower);
    } else if (["errors", "contracts", "types", "utils", "helpers", "constants", "enums"].includes(lower)) {
      target = join(sharedDir, lower);
    } else if (["prisma", "mongodb", "postgres", "redis", "mail", "s3", "stripe", "queue"].includes(lower)) {
      target = join(infraDir, lower);
    }

    if (target && !existsSync(target)) {
      try {
        renameSync(srcPath, target);
        console.log(`  → Movido ${dir}/ → ${target.replace(projectRoot + "/", "")}`);
      } catch (e) {
        console.log(`  ⚠ No se pudo mover ${dir}/: ${e.message}`);
      }
    }
  }

  return { created, profile, hasPlatform: isDir(platformDir), hasShared: isDir(sharedDir), hasInfra: isDir(infraDir) };
}

async function main() {
  console.log("\n  Bootstrap — Platform Initialization\n");
  const result = await bootstrapPlatform();
  console.log(`  Profile: ${result.profile}`);
  console.log(`  Platform: ${result.created.platform.join(", ") || "(existing)"}`);
  console.log(`  Shared: ${result.created.shared.join(", ") || "(existing)"}`);
  console.log(`  Infra: ${result.created.infra.join(", ") || "(existing)"}`);
  console.log();
}

if (process.argv[1] && (process.argv[1].endsWith("bootstrap.mjs") || process.argv[1].endsWith("bootstrap.js"))) {
  main().catch(console.error);
}
