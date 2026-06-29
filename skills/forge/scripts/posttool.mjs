#!/usr/bin/env node

/**
 * posttool.mjs — PostToolUse hook para Forge.
 *
 * Se ejecuta después de que el agente escribe código. Analiza los archivos
 * modificados y reporta violaciones arquitectónicas.
 *
 * Uso (CLI):
 *   node posttool.mjs                                    → analiza archivos changed en git
 *   node posttool.mjs <file1> [file2...]                 → analiza archivos específicos
 *   node posttool.mjs --diff                             → solo archivos changed vs default branch
 *   node posttool.mjs --json                             → salida JSON
 *   node posttool.mjs --strict                           → exit code 1 si hay CRITICAL/ERROR
 *   node posttool.mjs --reminder                         → solo recordatorio (no bloquea)
 *
 * Uso (API):
 *   import { postToolCheck } from "./posttool.mjs";
 *   const result = await postToolCheck([...files]);
 *
 * Integración en SKILL.md (Fase 7 del pipeline):
 *   node .opencode/skills/forge/scripts/posttool.mjs --reminder
 */

import { readFileSync, existsSync, statSync, readdirSync } from "fs";
import { join, relative, resolve, extname } from "path";
import { execFileSync } from "child_process";
import { getGraph } from "./graph.mjs";
import { buildContext } from "./context.mjs";
import { detectFeaturesOnSrc, allChecks, loadAllInlineIgnores, isIgnored } from "./detect.mjs";
import { evaluateRules } from "./registry/rules.mjs";
import {
  CYAN, GREEN, RED, YELLOW, BOLD, RESET, DIM, GRAY,
  formatViolation, formatCheck, formatJson,
} from "./formatter.mjs";

const ROOT = process.cwd();

function getChangedFiles() {
  let files = [];
  try {
    const defaultBranch = execFileSync("git", ["symbolic-ref", "refs/remotes/origin/HEAD"], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] })
      .trim().replace("refs/remotes/origin/", "");
    const raw = execFileSync("git", ["diff", "--name-only", "--diff-filter=ACMR", `${defaultBranch}...HEAD`], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
    files = raw.trim().split("\n").filter(Boolean);
  } catch {}

  if (files.length === 0) {
    try {
      const raw = execFileSync("git", ["status", "--porcelain"], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
      files = raw.split("\n").filter(Boolean).map(l => l.slice(3));
    } catch {}
  }

  return files.filter(f => f.startsWith("src/"));
}

function readFile(path) {
  try { return readFileSync(path, "utf-8"); } catch { return null; }
}

/**
 * Check modified files for violations.
 * Returns { violations, graphViolations, total, hasCritical, hasErrors, summary }
 */
export async function postToolCheck(files, opts = {}) {
  const { strict = false, reminder = false } = opts;

  if (!files || files.length === 0) {
    files = getChangedFiles();
  }

  // Only check source files
  files = files.filter(f =>
    f.endsWith(".ts") || f.endsWith(".mjs") || f.endsWith(".js") || f.endsWith(".tsx")
  );

  if (files.length === 0) {
    return { violations: [], graphViolations: [], total: 0, hasCritical: false, hasErrors: false, filesChecked: 0, summary: "Sin archivos fuente modificados" };
  }

  // Build context and run full audit
  const ctx = await buildContext();
  const features = detectFeaturesOnSrc();
  const graph = ctx.graph || getGraph();
  const results = allChecks(features, graph, ctx);

  // Load inline ignores
  const allIgnores = loadAllInlineIgnores(join(ROOT, "src"));

  // Collect violations that touch the modified files
  const violations = [];
  for (const [, cat] of Object.entries(results)) {
    for (const check of cat.checks) {
      if (check.pass) continue;

      // Only include violations touching modified files
      const touchesFile = files.some(f =>
        (check.detail && check.detail.includes(f)) ||
        (check.label && check.label.includes(f))
      );

      if (!touchesFile && !reminder) continue;

      // Check inline ignores
      if (isIgnored(check, allIgnores)) continue;

      violations.push(check);
    }
  }

  // Also evaluate graph rules for changed files
  const graphViolations = evaluateRules(graph, ctx).filter(v => {
    const touchesFile = files.some(f =>
      (v.file && v.file.includes(f)) ||
      (v.from && v.from.includes(f)) ||
      (v.to && v.to.includes(f))
    );
    return touchesFile || reminder;
  });

  const allViolations = [...violations, ...graphViolations];
  const hasCritical = allViolations.some(v => v.severity === "CRITICAL");
  const hasErrors = allViolations.some(v => v.severity === "ERROR");

  return {
    violations: allViolations,
    total: allViolations.length,
    hasCritical,
    hasErrors,
    filesChecked: files.length,
    summary: hasCritical
      ? `⚠ ${allViolations.length} violación(es) — ${allViolations.filter(v => v.severity === "CRITICAL").length} CRITICAL, ${allViolations.filter(v => v.severity === "ERROR").length} ERROR`
      : hasErrors
        ? `⚠ ${allViolations.length} violación(es) — ${allViolations.filter(v => v.severity === "ERROR").length} ERROR`
        : `${allViolations.length} violación(es) menores (WARNING/INFO)`,
  };
}

function printResult(result, opts = {}) {
  const { reminder = false } = opts;

  console.log(`\n${BOLD}${CYAN}═══ Forge PostTool Hook ═══${RESET}`);

  if (result.total === 0) {
    console.log(` ${GREEN}✔${RESET} Sin violaciones arquitectónicas en archivos modificados`);
    console.log(` ${DIM}Archivos revisados: ${result.filesChecked}${RESET}\n`);
    return;
  }

  console.log(` ${DIM}Archivos revisados: ${result.filesChecked}${RESET}`);
  console.log(` ${DIM}Violaciones: ${result.total}${RESET}\n`);

  if (reminder) {
    console.log(`  ${YELLOW}Recordatorio:${RESET} Los archivos modificados tienen ${result.total} violación(es) arquitectónica(s).`);
    console.log(`  Ejecuta ${CYAN}forge quench${RESET} para ver el detalle completo.\n`);

    if (result.hasCritical) {
      const criticalCount = result.violations.filter(v => v.severity === "CRITICAL").length;
      console.log(`  ${RED}⚠ ${criticalCount} violación(es) CRITICAL detectadas${RESET}`);
    }
    if (result.hasErrors) {
      const errorCount = result.violations.filter(v => v.severity === "ERROR").length;
      console.log(`  ${RED}⚠ ${errorCount} violación(es) ERROR detectadas${RESET}`);
    }

    // Print first 5 violations as summary
    const toShow = result.violations.slice(0, 5);
    for (const v of toShow) {
      console.log(formatCheck(v));
    }
    if (result.violations.length > 5) {
      console.log(`  ${DIM}... y ${result.violations.length - 5} más${RESET}`);
    }
    console.log();
    return;
  }

  // Full output
  for (const v of result.violations) {
    console.log(formatCheck(v));
  }

  console.log(`\n  ${BOLD}Resumen:${RESET} ${result.summary}`);
  if (result.hasCritical) {
    console.log(`  ${RED}⚠ Se requiere acción correctiva antes de continuar${RESET}`);
  }
  console.log();
}

async function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes("--json");
  const strict = args.includes("--strict");
  const reminder = args.includes("--reminder");
  const isDiff = args.includes("--diff");

  let files;
  if (isDiff) {
    files = getChangedFiles();
  } else {
    // Files passed as arguments
    files = args.filter(a => !a.startsWith("--"));
    if (files.length === 0) {
      files = getChangedFiles();
    }
  }

  const result = await postToolCheck(files, { strict, reminder });

  if (isJson) {
    console.log(formatJson(result));
  } else {
    printResult(result, { reminder });
  }

  if (strict && (result.hasCritical || result.hasErrors)) {
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("posttool.mjs")) {
  main().catch(console.error);
}
