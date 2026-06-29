#!/usr/bin/env node

/**
 * rollback.mjs — Backup & rollback para relocate/reforge.
 *
 * Uso:
 *   node rollback.mjs backup <target>        → backup feature/dir
 *   node rollback.mjs restore <backup-dir>   → restaurar backup
 *   node rollback.mjs list [target]          → listar backups
 *   node rollback.mjs verify <backup-dir>    → diff + score check
 *
 * Funciones exportadas para uso desde SKILL.md / agente:
 *   createBackup(target)     → { id, path, timestamp }
 *   restoreBackup(id)        → boolean
 *   listBackups(target?)     → BackupMeta[]
 *   verifyAfterChange()      → { score, improved, suggestedCommit }
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, cpSync, rmSync, statSync } from "fs";
import { join, relative, resolve, basename } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const ROOT = process.cwd();
const BACKUP_DIR = join(ROOT, ".forge", "backups");
const TIMESTAMP = () => new Date().toISOString().replace(/[:.]/g, "-");

function sanitize(name) {
  return name.replace(/[^a-zA-Z0-9_\-/]/g, "_").replace(/\//g, "--");
}

function shell(cmd, args, cwd = ROOT) {
  try {
    return execFileSync(cmd, args, { encoding: "utf-8", cwd }).trim();
  } catch {
    return null;
  }
}

export function createBackup(target) {
  const targetPath = resolve(ROOT, target);
  if (!existsSync(targetPath)) {
    console.error(`rollback: target no existe: ${target}`);
    return null;
  }

  const ts = TIMESTAMP();
  const id = `${sanitize(target)}--${ts}`;
  const dest = join(BACKUP_DIR, id);

  mkdirSync(dest, { recursive: true });
  const rel = relative(ROOT, targetPath);

  // Try git stash push -k first (preserves working tree, stashes only target)
  const gitRoot = shell("git", ["rev-parse", "--show-toplevel"]);
  let method = "copy";
  if (gitRoot) {
    try {
      shell("git", ["stash", "push", "-k", "--", target]);
      method = "git-stash";
      // Copy from git (unstashed) — actually stash pop restores
      // For git mode, we save the diff instead
    } catch {
      // fall through to copy
    }
  }

  // Copy files to backup dir
  if (statSync(targetPath).isDirectory()) {
    cpSync(targetPath, join(dest, basename(targetPath)), { recursive: true });
  } else {
    const parent = join(dest, rel.replace(/\//g, "--"));
    mkdirSync(parent, { recursive: true });
    cpSync(targetPath, join(parent, basename(targetPath)));
  }

  // Save metadata
  const meta = {
    id,
    target: rel,
    timestamp: new Date().toISOString(),
    method,
    files: collectFiles(targetPath),
  };
  writeFileSync(join(dest, "backup.json"), JSON.stringify(meta, null, 2) + "\n", "utf-8");

  console.log(`rollback: backup creado → ${rel} (${id})`);
  return meta;
}

function collectFiles(targetPath) {
  if (!statSync(targetPath).isDirectory()) return [targetPath];
  const files = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push(full);
    }
  }
  walk(targetPath);
  return files;
}

export function restoreBackup(id) {
  const backupPath = join(BACKUP_DIR, id);
  if (!existsSync(backupPath)) {
    console.error(`rollback: backup no encontrado: ${id}`);
    return false;
  }

  const metaPath = join(backupPath, "backup.json");
  if (!existsSync(metaPath)) {
    console.error(`rollback: metadatos no encontrados en ${id}`);
    return false;
  }

  const meta = JSON.parse(readFileSync(metaPath, "utf-8"));
  const targetPath = resolve(ROOT, meta.target);

  // Restore files
  if (existsSync(targetPath)) {
    rmSync(targetPath, { recursive: true, force: true });
  }

  const backupData = join(backupPath, basename(targetPath));
  if (existsSync(backupData)) {
    cpSync(backupData, targetPath, { recursive: true });
  }

  console.log(`rollback: restaurado → ${meta.target} (from ${id})`);
  return true;
}

export function listBackups(target) {
  if (!existsSync(BACKUP_DIR)) return [];

  const entries = readdirSync(BACKUP_DIR, { withFileTypes: true });
  const backups = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const metaPath = join(BACKUP_DIR, entry.name, "backup.json");
    if (!existsSync(metaPath)) continue;

    try {
      const meta = JSON.parse(readFileSync(metaPath, "utf-8"));
      if (!target || meta.target.includes(target)) {
        backups.push(meta);
      }
    } catch {
      // skip invalid
    }
  }

  return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function verifyAfterChange() {
  try {
    const __dirname = fileURLToPath(new URL(".", import.meta.url));
    const out = shell("node", [join(__dirname, "inspect.mjs"), "--diff", "--json"]);
    if (!out) return { score: 0, improved: false, error: "inspect falló" };

    const result = JSON.parse(out);
    const score = result.total || result.diff?.totalScore || 0;
    const improved = result.diff?.improved !== false;

    let suggestedCommit = null;
    if (improved && score > 0) {
      const branch = shell("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
      suggestedCommit = `git add -A && git commit -m "forge: relocate/reforge (score: ${score})"`;
    }

    return { score, improved, suggestedCommit };
  } catch {
    return { score: 0, improved: false, error: "verify falló" };
  }
}

// ── Export for agent use ──
export const rollback = { createBackup, restoreBackup, listBackups, verifyAfterChange };

// ── CLI ──
const [,, action, arg] = process.argv;

if (action === "backup" && arg) {
  process.exit(createBackup(arg) ? 0 : 1);
} else if (action === "restore" && arg) {
  process.exit(restoreBackup(arg) ? 0 : 1);
} else if (action === "list") {
  const backups = listBackups(arg);
  if (backups.length === 0) {
    console.log("No hay backups disponibles.");
  } else {
    console.log("\n── Backups ──\n");
    for (const b of backups) {
      const date = b.timestamp.slice(0, 19).replace("T", " ");
      console.log(`  ${b.id.padEnd(50)} ${date}  (${b.files?.length || 0} archivos)`);
    }
    console.log();
  }
  process.exit(0);
} else if (action === "verify") {
  const result = verifyAfterChange();
  if (result.error) {
    console.error(`rollback: ${result.error}`);
    process.exit(1);
  }
  console.log(`Score: ${result.score} | ${result.improved ? "✓ Mejoró/igual" : "✘ Empeoró"}${result.suggestedCommit ? `\nSugerencia: ${result.suggestedCommit}` : ""}`);
  process.exit(result.improved ? 0 : 1);
} else {
  console.log("Uso: node rollback.mjs <backup|restore|list|verify> [target|id]");
  process.exit(1);
}
