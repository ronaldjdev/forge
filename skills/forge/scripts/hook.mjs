#!/usr/bin/env node

/**
 * hook.mjs — Git pre-commit hook para validación arquitectónica.
 *
 * Instala/uninstall un hook de git pre-commit que ejecuta forge detect
 * sobre los archivos staged y bloquea el commit si hay violaciones CRITICAL
 * o ERROR en los archivos tocados.
 *
 * Uso:
 *   node hook.mjs install              → Instalar hook pre-commit
 *   node hook.mjs uninstall            → Eliminar hook pre-commit
 *   node hook.mjs status               → Mostrar estado del hook
 *   node hook.mjs check                → Ejecutar validación sobre staged files
 *   node hook.mjs ignore <rule-id>     → Ignorar regla específica
 *   node hook.mjs unignore <rule-id>   → Dejar de ignorar regla
 *   node hook.mjs list-ignored         → Listar reglas ignoradas
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "fs";
import { join, relative, resolve } from "path";
import { execFileSync } from "child_process";

const ROOT = process.cwd();
const HOOKS_DIR = join(ROOT, ".git", "hooks");
const HOOK_PATH = join(HOOKS_DIR, "pre-commit");
const IGNORE_PATH = join(ROOT, ".forge", "hooks-ignore.json");
const SCRIPT_DIR = new URL(".", import.meta.url).pathname;

const HOOK_TEMPLATE = `#!/bin/sh
# forge pre-commit hook — valida arquitectura antes de cada commit
# Instalado por: node .opencode/skills/forge/scripts/hook.mjs install

FORGE_SCRIPTS="${SCRIPT_DIR}"
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR -- "*.ts" "*.js" "*.mjs" "*.tsx" "*.jsx" 2>/dev/null)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# Ejecutar detect sobre los archivos staged
node "$FORGE_SCRIPTS/hook.mjs" check
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "✘ [forge] Commit bloqueado por violaciones arquitectónicas."
  echo "  Para ignorar: node .opencode/skills/forge/scripts/hook.mjs ignore <rule-id>"
  echo "  Para saltar: git commit --no-verify"
  exit 1
fi

exit 0
`;

function readJson(path) {
  try { return JSON.parse(readFileSync(path, "utf-8")); } catch { return null; }
}

function writeJson(path, data) {
  try {
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
    return true;
  } catch { return false; }
}

function shell(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
  } catch { return ""; }
}

function getStagedFiles() {
  const raw = shell("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "--", "*.ts", "*.js", "*.mjs", "*.tsx", "*.jsx"]);
  return raw ? raw.split("\n").filter(Boolean) : [];
}

function isGitRepo() {
  return shell("git", ["rev-parse", "--git-dir"]) !== "";
}

function loadIgnored() {
  const data = readJson(IGNORE_PATH);
  return Array.isArray(data?.ignored) ? data.ignored : [];
}

function saveIgnored(ignored) {
  return writeJson(IGNORE_PATH, { ignored });
}

function hookInstalled() {
  if (!existsSync(HOOK_PATH)) return false;
  const content = readFileSync(HOOK_PATH, "utf-8");
  return content.includes("# forge pre-commit hook");
}

// ── Actions ──

function cmdInstall() {
  if (!isGitRepo()) {
    console.error("forge-hooks: no es un repositorio git");
    process.exit(1);
  }

  if (hookInstalled()) {
    console.log("forge-hooks: pre-commit hook ya instalado en .git/hooks/pre-commit");
    process.exit(0);
  }

  mkdirSync(HOOKS_DIR, { recursive: true });
  writeFileSync(HOOK_PATH, HOOK_TEMPLATE, { mode: 0o755 });
  console.log("forge-hooks: pre-commit hook instalado en .git/hooks/pre-commit");
}

function cmdUninstall() {
  if (!existsSync(HOOK_PATH)) {
    console.log("forge-hooks: no hay hook pre-commit instalado");
    process.exit(0);
  }

  rmSync(HOOK_PATH, { force: true });
  console.log("forge-hooks: pre-commit hook eliminado");
}

function cmdStatus() {
  const installed = hookInstalled();
  const ignored = loadIgnored();
  console.log("── Forge Hooks ──");
  console.log(`  Pre-commit hook: ${installed ? "✓ instalado" : "✘ no instalado"}`);
  console.log(`  Reglas ignoradas: ${ignored.length > 0 ? ignored.join(", ") : "(ninguna)"}`);
  console.log(`  Hook path: ${HOOK_PATH}`);
  console.log(`  Ignore file: ${IGNORE_PATH}`);
}

async function cmdCheck() {
  if (!isGitRepo()) {
    console.error("forge-hooks: no es un repositorio git");
    process.exit(1);
  }

  const stagedFiles = getStagedFiles();
  if (stagedFiles.length === 0) {
    process.exit(0);
  }

  const ignored = loadIgnored();
  const srcFiles = stagedFiles.filter(f => f.startsWith("src/"));
  if (srcFiles.length === 0) process.exit(0);

  // Run detect only over the staged source files
  const { allChecks, detectFeaturesOnSrc } = await import("./detect.mjs");
  const { getGraph } = await import("./graph.mjs");
  const { buildContext } = await import("./context.mjs");

  const ctx = await buildContext();
  const graph = ctx.graph || getGraph();
  const features = detectFeaturesOnSrc();
  const results = allChecks(features, graph, ctx);

  let violations = [];
  for (const [, cat] of Object.entries(results)) {
    for (const check of cat.checks) {
      if (!check.pass && (check.severity === "CRITICAL" || check.severity === "ERROR")) {
        // Check if this violation touches a staged file
        const touchesStaged = !check.detail || srcFiles.some(sf => check.detail.includes(sf) || check.label.includes(sf));
        if (touchesStaged) {
          // Check if rule is ignored
          const ruleMatch = check.label.match(/\[([^\]]+)\]/);
          const ruleId = ruleMatch ? ruleMatch[1] : null;
          if (!ruleId || !ignored.includes(ruleId)) {
            violations.push(check);
          }
        }
      }
    }
  }

  if (violations.length > 0) {
    console.log(`\n✘ [forge-hooks] ${violations.length} violacion(es) CRITICAL/ERROR bloquean el commit:\n`);
    for (const v of violations) {
      console.log(`  [${v.severity}] ${v.label}`);
      if (v.fix) console.log(`       → Fix: ${v.fix}`);
    }
    console.log(`\n  Para ignorar: node .opencode/skills/forge/scripts/hook.mjs ignore <rule-id>`);
    console.log(`  Para saltar: git commit --no-verify\n`);
    process.exit(1);
  }

  process.exit(0);
}

function cmdIgnore(ruleId) {
  if (!ruleId) {
    console.error("Uso: node hook.mjs ignore <rule-id>");
    process.exit(1);
  }
  const ignored = loadIgnored();
  if (ignored.includes(ruleId)) {
    console.log(`forge-hooks: regla "${ruleId}" ya está ignorada`);
  } else {
    ignored.push(ruleId);
    saveIgnored(ignored);
    console.log(`forge-hooks: regla "${ruleId}" añadida a ignorados`);
  }
}

function cmdUnignore(ruleId) {
  if (!ruleId) {
    console.error("Uso: node hook.mjs unignore <rule-id>");
    process.exit(1);
  }
  const ignored = loadIgnored().filter(r => r !== ruleId);
  saveIgnored(ignored);
  console.log(`forge-hooks: regla "${ruleId}" eliminada de ignorados`);
}

function cmdListIgnored() {
  const ignored = loadIgnored();
  if (ignored.length === 0) {
    console.log("forge-hooks: no hay reglas ignoradas");
  } else {
    console.log("── Reglas ignoradas ──");
    for (const r of ignored) console.log(`  ${r}`);
  }
}

// ── CLI ──

const [,, action, arg] = process.argv;

switch (action) {
  case "install":    cmdInstall(); break;
  case "uninstall":  cmdUninstall(); break;
  case "status":     cmdStatus(); break;
  case "check":      await cmdCheck(); break;
  case "ignore":     cmdIgnore(arg); break;
  case "unignore":   cmdUnignore(arg); break;
  case "list-ignored": cmdListIgnored(); break;
  default:
    console.log("Uso: node hook.mjs <install|uninstall|status|check|ignore|unignore|list-ignored>");
    console.log("\n  install           → Instalar hook pre-commit");
    console.log("  uninstall         → Eliminar hook pre-commit");
    console.log("  status            → Mostrar estado del hook");
    console.log("  check             → Validar archivos staged");
    console.log("  ignore <rule-id>  → Ignorar regla específica");
    console.log("  unignore <rule-id>→ Dejar de ignorar regla");
    console.log("  list-ignored      → Listar reglas ignoradas");
    process.exit(1);
}
