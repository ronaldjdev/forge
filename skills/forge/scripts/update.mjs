#!/usr/bin/env node

/**
 * forge update — Version check contra forge.dev/latest.
 * Cache de 24h en .forge/version-cache.json.
 * No auto-actualiza; solo notifica.
 *
 * Uso:
 *   node update.mjs
 *   node update.mjs --json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = process.cwd();
const CACHE_PATH = join(ROOT, ".forge", "version-cache.json");
const CACHE_TTL = 86400000; // 24h
const VERSION_URL = "https://forge.dev/latest";

function readVersion() {
  const candidates = [
    join(__dirname, "..", "package.json"),
    join(__dirname, "..", "..", "package.json"),
    join(__dirname, "..", "..", "..", "package.json"),
    join(__dirname, "..", "..", "..", "..", "package.json"),
    join(__dirname, "..", "..", "..", "..", "..", "package.json"),
  ];
  for (const p of candidates) {
    try {
      const pkg = JSON.parse(readFileSync(p, "utf-8"));
      if (pkg.version && pkg.name === "@ronaldjdevfs/forge") return pkg.version;
    } catch {}
  }
  return "0.0.0";
}
const CURRENT_VERSION = readVersion();

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function writeJson(path, data) {
  try {
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
    return true;
  } catch {
    return false;
  }
}

async function fetchLatestVersion() {
  try {
    const response = await fetch(VERSION_URL, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const data = await response.json();
    return data.version || data.latest || null;
  } catch {
    return null;
  }
}

function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

async function main() {
  const isJson = process.argv.includes("--json");

  // Check cache
  const cached = readJson(CACHE_PATH);
  if (cached && cached.timestamp && (Date.now() - cached.timestamp) < CACHE_TTL) {
    const cmp = compareVersions(cached.latest, CURRENT_VERSION);
    const updateAvailable = cmp > 0;

    if (isJson) {
      console.log(JSON.stringify({ current: CURRENT_VERSION, latest: cached.latest, updateAvailable, changelog: cached.changelog || null, cached: true }, null, 2));
    } else if (updateAvailable) {
      console.log(`📦 Forge ${cached.latest} disponible (tienes ${CURRENT_VERSION}).`);
      if (cached.changelog) console.log(`   Changelog: ${cached.changelog}`);
      console.log("   Para actualizar: npm install -g @ronaldjdevfs/forge");
    } else {
      console.log(`Forge ${CURRENT_VERSION} — última versión.`);
    }
    process.exit(0);
  }

  // Fetch from network
  const latest = await fetchLatestVersion();
  if (!latest) {
    if (isJson) {
      console.log(JSON.stringify({ current: CURRENT_VERSION, latest: null, error: "No se pudo conectar con forge.dev/latest" }, null, 2));
    } else {
      console.log("No se pudo verificar versión. Revisa tu conexión.");
    }
    process.exit(0);
  }

  // Update cache
  writeJson(CACHE_PATH, { latest, timestamp: Date.now(), changelog: null });

  const cmp = compareVersions(latest, CURRENT_VERSION);
  const updateAvailable = cmp > 0;

  if (isJson) {
    console.log(JSON.stringify({ current: CURRENT_VERSION, latest, updateAvailable }, null, 2));
  } else if (updateAvailable) {
    console.log(`📦 Forge ${latest} disponible (tienes ${CURRENT_VERSION}).`);
    console.log("   Para actualizar: npm install -g @ronaldjdevfs/forge");
  } else {
    console.log(`Forge ${CURRENT_VERSION} — última versión.`);
  }
  process.exit(0);
}

if (process.argv[1] && (process.argv[1].endsWith("update.mjs") || process.argv[1].endsWith("update.js"))) {
  main().catch(console.error);
}
