#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, dirname, relative } from "path";
import { createHash } from "crypto";

const ROOT = process.cwd();
const CONFIG_DIR = join(ROOT, ".forge");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");
const STATE_PATH = join(CONFIG_DIR, "state.json");
const HISTORY_DIR = join(CONFIG_DIR, "history");
const CACHE_DIR = join(CONFIG_DIR, "cache");

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const DEFAULT_CONFIG = {
  profile: null,
  framework: null,
  database: null,
  orm: null,
  diStrategy: null,
  runtime: null,
  ignorePaths: ["src/generated", "src/__tests__/fixtures", "src/**/*.spec.ts", "src/**/*.test.ts"],
  lastContextUpdate: null,
};

const DEFAULT_STATE = {
  lastAudit: null,
  lastScore: null,
  lastMax: null,
  lastGrade: null,
  violationCount: 0,
  totalFeatures: 0,
  migratedFeatures: 0,
  legacyFeatures: 0,
  platformExists: false,
  health: "unknown",
};

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function writeJson(path, data) {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
    return true;
  } catch {
    return false;
  }
}

export function loadConfig() {
  const config = readJson(CONFIG_PATH);
  if (!config) {
    return { ...DEFAULT_CONFIG };
  }
  return { ...DEFAULT_CONFIG, ...config };
}

export function saveConfig(config) {
  return writeJson(CONFIG_PATH, config);
}

export function loadState() {
  const state = readJson(STATE_PATH);
  if (!state) {
    return { ...DEFAULT_STATE };
  }
  return { ...DEFAULT_STATE, ...state };
}

export function saveState(state) {
  return writeJson(STATE_PATH, state);
}

export function updateStateFromAudit(auditResult) {
  const state = loadState();
  state.lastAudit = new Date().toISOString();
  state.lastScore = auditResult.total || 0;
  state.lastMax = auditResult.max || null;
  state.lastGrade = auditResult.grade || "F";
  state.violationCount = (auditResult.violations || []).length;
  state.health = auditResult.health || "unknown";
  if (auditResult.context) {
    state.totalFeatures = auditResult.context.features?.total || 0;
    state.migratedFeatures = auditResult.context.features?.migrated?.length || 0;
    state.legacyFeatures = auditResult.context.features?.legacy?.length || 0;
  }
  return saveState(state);
}

export function saveHistory(snapshot) {
  mkdirSync(HISTORY_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const path = join(HISTORY_DIR, `audit-${ts}.json`);
  return writeJson(path, { ...snapshot, timestamp: new Date().toISOString() });
}

export function loadHistory(limit = 20) {
  mkdirSync(HISTORY_DIR, { recursive: true });
  try {
    const files = readdirSync(HISTORY_DIR)
      .filter(f => f.startsWith("audit-") && f.endsWith(".json"))
      .sort()
      .slice(-limit);
    return files.map(f => readJson(join(HISTORY_DIR, f))).filter(Boolean);
  } catch {
    return [];
  }
}

export function displayTrend(entries) {
  if (entries.length === 0) return console.log("No hay historial de auditorías.");
  console.log("\n── Forge Trend ──\n");
  console.log(`${"Fecha".padEnd(22)} ${"Score".padEnd(6)} ${"Grade".padEnd(6)} ${"Violaciones".padEnd(12)} ${"Features"}`);
  console.log("─".repeat(60));
  for (const e of entries) {
    const date = (e.timestamp || "").slice(0, 19).replace("T", " ");
    const score = e.score !== undefined ? `${e.score}${e.max ? "/".concat(e.max) : ""}` : "—";
    const grade = e.grade || "—";
    const violations = e.violationCount !== undefined ? String(e.violationCount) : "—";
    const features = e.totalFeatures !== undefined ? `${e.migratedFeatures || 0}/${e.totalFeatures}` : "—";
    console.log(`${date.padEnd(22)} ${score.padEnd(6)} ${grade.padEnd(6)} ${violations.padEnd(12)} ${features}`);
  }
  if (entries.length >= 2) {
    const first = entries[0];
    const last = entries[entries.length - 1];
    const delta = (last.score || 0) - (first.score || 0);
    console.log("─".repeat(60));
    console.log(`Δ total: ${delta > 0 ? "+" : ""}${delta} puntos (${delta > 0 ? "mejora" : delta < 0 ? "empeora" : "estable"})`);
  }
}

export function updateConfigFromContext(ctx) {
  const config = loadConfig();
  let changed = false;

  if (ctx.framework && ctx.framework !== "unknown" && ctx.framework !== config.framework) {
    config.framework = ctx.framework;
    changed = true;
  }
  if (ctx.database && ctx.database !== "unknown" && ctx.database !== config.database) {
    config.database = ctx.database;
    changed = true;
  }
  if (ctx.orm && ctx.orm !== "none" && ctx.orm !== config.orm) {
    config.orm = ctx.orm;
    changed = true;
  }
  if (ctx.diStrategy && ctx.diStrategy !== "manual" && ctx.diStrategy !== config.diStrategy) {
    config.diStrategy = ctx.diStrategy;
    changed = true;
  }
  if (ctx.runtime && ctx.runtime !== config.runtime) {
    config.runtime = ctx.runtime;
    changed = true;
  }
  if (ctx.profile && ctx.profile !== config.profile) {
    config.profile = ctx.profile;
    changed = true;
  }

  if (changed) {
    config.lastContextUpdate = new Date().toISOString();
    return saveConfig(config);
  }
  return true;
}

export function configNeedsRefresh(config) {
  if (!config.lastContextUpdate) return true;
  const daysSinceUpdate = (Date.now() - new Date(config.lastContextUpdate).getTime()) / 86400000;
  return daysSinceUpdate > 7;
}

/* ── Cache Layer ── */

const CACHE_KEYS = ["context", "graph", "profile", "ownership", "chain"];

function cachePath(key) {
  mkdirSync(CACHE_DIR, { recursive: true });
  return join(CACHE_DIR, `${key}.json`);
}

function cacheMetaPath() {
  mkdirSync(CACHE_DIR, { recursive: true });
  return join(CACHE_DIR, "meta.json");
}

function loadCacheMeta() {
  try {
    return JSON.parse(readFileSync(cacheMetaPath(), "utf-8"));
  } catch {
    return {};
  }
}

function saveCacheMeta(meta) {
  const existing = loadCacheMeta();
  writeFileSync(cacheMetaPath(), JSON.stringify({ ...existing, ...meta }, null, 2) + "\n");
}

/**
 * Compute a hash of the src/ directory tree (file paths + mtimes).
 * Used to detect if the project changed since last cache.
 */
export function hashSrcDir(projectRoot = ROOT) {
  const src = join(projectRoot, "src");
  if (!existsSync(src)) return null;
  const hash = createHash("sha256");
  const entries = [];
  function walk(dir) {
    let dirEntries;
    try { dirEntries = readdirSync(dir); } catch { return; }
    for (const entry of dirEntries.sort()) {
      const full = join(dir, entry);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".ts") || entry.endsWith(".js") || entry.endsWith(".tsx") || entry.endsWith(".json")) {
        entries.push(relative(projectRoot, full) + ":" + st.mtimeMs);
      }
    }
  }
  walk(src);
  hash.update(entries.join("\n"));
  return hash.digest("hex").slice(0, 16);
}

/**
 * Save a value to the cache with a src hash for invalidation.
 */
export function saveCache(key, data, projectRoot = ROOT) {
  if (!CACHE_KEYS.includes(key)) return false;
  const srcHash = hashSrcDir(projectRoot);
  const payload = {
    key,
    srcHash,
    cachedAt: Date.now(),
    data,
  };
  const ok = writeJson(cachePath(key), payload);
  if (ok) {
    saveCacheMeta({ [key]: { srcHash, cachedAt: Date.now() } });
  }
  return ok;
}

/**
 * Load a value from cache if valid (same src hash and not expired).
 * Returns { data, valid } where valid is false if cache is stale.
 */
export function loadCache(key, projectRoot = ROOT) {
  if (!CACHE_KEYS.includes(key)) return { data: null, valid: false };
  const path = cachePath(key);
  const cached = readJson(path);
  if (!cached) return { data: null, valid: false };

  // Check TTL
  if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
    return { data: null, valid: false };
  }

  // Check src hash match
  const currentHash = hashSrcDir(projectRoot);
  if (currentHash && currentHash !== cached.srcHash) {
    return { data: null, valid: false };
  }

  return { data: cached.data, valid: true };
}

/**
 * Invalidate a specific cache key or all keys.
 */
export function invalidateCache(key = null) {
  if (key) {
    const path = cachePath(key);
    try { writeFileSync(path, JSON.stringify({}), "utf-8"); } catch {}
  } else {
    for (const k of CACHE_KEYS) {
      try { writeFileSync(cachePath(k), JSON.stringify({}), "utf-8"); } catch {}
    }
  }
}

/**
 * Determine required boot depth based on command.
 * Returns 'minimal' | 'standard' | 'full'
 * - minimal: context + profile (cast, temper, smelt, relocate, reforge, inscribe)
 * - standard: minimal + graph + chain (chain, graph)
 * - full: standard + armorer + inspect + detect + architecture (inspect, quench, default)
 */
export function getBootDepth(command) {
  const minimal = ["cast", "temper", "smelt", "relocate", "reforge", "inscribe", "nail", "unnail", "forge-api", "forge state", "forge rollback"];
  const standard = ["chain", "graph", "forge hook"];
  if (minimal.includes(command)) return "minimal";
  if (standard.includes(command)) return "standard";
  return "full";
}

/**
 * Try to load cached boot data up to a given depth.
 * Returns { context, profile, graph, chain, ownership } with valid fields populated.
 */
export function loadCachedBoot(depth = "full", projectRoot = ROOT) {
  const result = { context: null, profile: null, graph: null, chain: null, ownership: null };

  // Always try context
  const ctxCache = loadCache("context", projectRoot);
  if (ctxCache.valid) result.context = ctxCache.data;

  // Always try profile
  const profCache = loadCache("profile", projectRoot);
  if (profCache.valid) result.profile = profCache.data;

  if (depth === "minimal") return result;

  // Standard: add graph + chain
  const graphCache = loadCache("graph", projectRoot);
  if (graphCache.valid) result.graph = graphCache.data;

  const chainCache = loadCache("chain", projectRoot);
  if (chainCache.valid) result.chain = chainCache.data;

  if (depth === "standard") return result;

  // Full: add ownership
  const ownCache = loadCache("ownership", projectRoot);
  if (ownCache.valid) result.ownership = ownCache.data;

  return result;
}

/**
 * Check if cached boot is valid for a given depth.
 */
export function hasValidCache(depth = "full", projectRoot = ROOT) {
  const cached = loadCachedBoot(depth, projectRoot);
  if (!cached.context) return false;
  if (depth === "minimal") return true;
  if (!cached.graph) return false;
  if (depth === "standard") return true;
  if (!cached.ownership) return false;
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes("--json");
  const action = args.find(a => a === "--init" || a === "--update" || a === "--show" || a === "--clear-state" || a === "--history" || a === "--trend");

  if (action === "--init") {
    if (existsSync(CONFIG_PATH)) {
      console.log("forge-config: config.json ya existe en .forge/");
      process.exit(0);
    }
    const ok = writeJson(CONFIG_PATH, DEFAULT_CONFIG);
    writeJson(STATE_PATH, DEFAULT_STATE);
    console.log(`forge-config: config.json ${ok ? "creado" : "ERROR"} en .forge/`);
    process.exit(ok ? 0 : 1);
  }

  if (action === "--show") {
    const config = loadConfig();
    const state = loadState();
    if (isJson) {
      console.log(JSON.stringify({ config, state }, null, 2));
    } else {
      console.log("── Forge Config ──");
      for (const [k, v] of Object.entries(config)) {
        console.log(`  ${k}: ${v ?? "(sin detectar)"}`);
      }
      console.log("\n── Forge State ──");
      for (const [k, v] of Object.entries(state)) {
        console.log(`  ${k}: ${v ?? "(sin datos)"}`);
      }
    }
    process.exit(0);
  }

  if (action === "--clear-state") {
    writeJson(STATE_PATH, DEFAULT_STATE);
    console.log("forge-config: state.json limpiado");
    process.exit(0);
  }

  if (action === "--history") {
    const entries = loadHistory(isJson ? 999 : 20);
    if (isJson) {
      console.log(JSON.stringify(entries, null, 2));
    } else {
      displayTrend(entries);
    }
    process.exit(0);
  }

  if (action === "--trend") {
    const entries = loadHistory(20);
    if (isJson) {
      console.log(JSON.stringify(entries.map(e => ({ timestamp: e.timestamp, score: e.score, grade: e.grade })), null, 2));
    } else {
      displayTrend(entries);
    }
    process.exit(0);
  }

  if (action === "--update") {
    const { buildContext } = await import("./context.mjs");
    const { detectProfile } = await import("./profile.mjs");
    const ctx = await buildContext();
    const profile = detectProfile(ctx);
    ctx.profile = profile;
    updateConfigFromContext(ctx);
    console.log("forge-config: config.json actualizado desde context");
    process.exit(0);
  }

  // Default: print status
  const config = loadConfig();
  const state = loadState();
  const needsRefresh = configNeedsRefresh(config);
  const summary = {
    configExists: existsSync(CONFIG_PATH),
    stateExists: existsSync(STATE_PATH),
    needsRefresh,
    config,
    state,
  };
  if (isJson) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`Config: ${summary.configExists ? "✓" : "✗"} | State: ${summary.stateExists ? "✓" : "✗"} | Refresh needed: ${needsRefresh}`);
  }
  process.exit(0);
}

if (process.argv[1] && (process.argv[1].endsWith("forge-config.mjs") || process.argv[1].endsWith("forge-config.js"))) {
  main().catch(console.error);
}
