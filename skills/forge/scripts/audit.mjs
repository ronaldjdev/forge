#!/usr/bin/env node

import { join, basename } from "path";
import { buildContext } from "./context.mjs";
import { detectProfile } from "./profile.mjs";
import { buildDependencyGraph } from "./dependencies.mjs";
import { allChecks } from "./detect.mjs";

const ROOT = process.cwd();

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const GRAY = "\x1b[90m";

const SEVERITY_COLORS = {
  CRITICAL: RED,
  ERROR: RED,
  WARNING: YELLOW,
  INFO: CYAN,
  SUGGESTION: GRAY,
};

const CAT_NAMES = {
  structure: "Estructura",
  layers: "Capas",
  decorators: "Decoradores",
  legacy: "Legacy",
  config: "Configuración",
};

const CAT_MAX = {
  structure: 30,
  layers: 25,
  decorators: 20,
  legacy: 15,
  config: 10,
};

function countBySeverity(checks) {
  const counts = {};
  for (const c of checks) {
    if (!c.pass) {
      counts[c.severity] = (counts[c.severity] || 0) + 1;
    }
  }
  return counts;
}

function buildReport(result) {
  let total = 0;
  let maxTotal = 0;
  const violations = [];
  const recommendations = [];

  for (const [name, cat] of Object.entries(result.categories)) {
    total += cat.score;
    maxTotal += CAT_MAX[name] || 10;
    for (const check of cat.checks) {
      if (!check.pass) {
        violations.push({ category: name, ...check });
        if (check.fix) recommendations.push(check.fix);
      }
    }
  }

  return { total, max: maxTotal, categories: result.categories, violations, recommendations, severityCounts: countBySeverity(violations) };
}

function printReport(report, ctx, profile, graph) {
  const barLen = 40;
  const pct = report.max > 0 ? Math.round((report.total / report.max) * 100) : 0;

  function scoreBar(score, max) {
    const p = max > 0 ? Math.round((score / max) * barLen) : 0;
    const filled = "█".repeat(p);
    const empty = "░".repeat(barLen - p);
    const color = score >= max * 0.8 ? GREEN : score >= max * 0.5 ? YELLOW : RED;
    return `${color}${filled}${RESET}${DIM}${empty}${RESET}`;
  }

  console.log("\n" + "═".repeat(58));
  console.log(`${BOLD}${CYAN}   FORGE AUDIT — Reporte Hexagonal${RESET}`);
  console.log(`   ${DIM}Proyecto: ${basename(ROOT)}${RESET}`);
  console.log(`   ${DIM}Perfil:   ${profile}${RESET}`);
  console.log(`   ${DIM}Framework: ${ctx.framework} | DB: ${ctx.database} | ORM: ${ctx.orm} | DI: ${ctx.diStrategy}${RESET}`);
  console.log(`   ${DIM}Fecha:    ${new Date().toISOString().slice(0, 10)}${RESET}`);
  console.log("═".repeat(58) + "\n");

  const gradeColor = pct >= 80 ? GREEN : pct >= 50 ? YELLOW : RED;
  const grade = pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 65 ? "C" : pct >= 50 ? "D" : "F";
  console.log(`  ${BOLD}Puntaje total: ${gradeColor}${report.total}/${report.max} (${pct}%) — ${grade}${RESET}\n`);

  /* Severity summary */
  if (Object.keys(report.severityCounts).length > 0) {
    console.log(`  ${BOLD}Resumen por severidad${RESET}`);
    for (const [sev, count] of Object.entries(report.severityCounts)) {
      const color = SEVERITY_COLORS[sev] || GRAY;
      console.log(`   ${color}${sev}${RESET}: ${count}`);
    }
    console.log();
  }

  /* Context summary */
  console.log(`  ${BOLD}Contexto del proyecto${RESET}`);
  console.log(`   Features migrados: ${ctx.features.migrated.length}`);
  console.log(`   Features legacy:   ${ctx.features.legacy.length}`);
  console.log(`   Dependencias:      ${graph.edges.length} edges entre ${graph.nodes.length} features`);
  if (graph.hasCycles) console.log(`   ${RED}Ciclos detectados en el grafo de dependencias${RESET}`);
  if (graph.edges.length > 0) {
    for (const edge of graph.edges) {
      console.log(`   ${GRAY}→ ${edge.source} depende de ${edge.target} (${edge.file})${RESET}`);
    }
  }
  console.log();

  /* Categories */
  for (const [key, cat] of Object.entries(report.categories)) {
    const name = CAT_NAMES[key] || key;
    const cmax = CAT_MAX[key] || cat.max || 10;
    console.log(`  ${BOLD}${name} (${cat.score}/${cmax})${RESET}`);
    console.log(`  ${scoreBar(cat.score, cmax)}`);

    for (const check of cat.checks) {
      const icon = check.pass ? `${GREEN}✔${RESET}` : `${RED}✘${RESET}`;
      const sev = check.pass ? "" : ` ${SEVERITY_COLORS[check.severity]}[${check.severity}]${RESET}`;
      const detail = check.detail ? ` ${GRAY}— ${check.detail}${RESET}` : "";
      console.log(`   ${icon}${sev} ${check.label}${detail}`);
      if (!check.pass && check.fix) {
        console.log(`     ${DIM}→ Fix: ${check.fix}${RESET}`);
      }
    }
    console.log();
  }

  if (report.recommendations.length > 0) {
    console.log(`  ${BOLD}${YELLOW}Recomendaciones${RESET}`);
    const unique = [...new Set(report.recommendations)];
    unique.forEach((r, i) => console.log(`   ${i + 1}. ${r}`));
    console.log();
  }

  console.log("═".repeat(58) + "\n");
}

function printJson(report, ctx, profile, graph) {
  console.log(JSON.stringify({ ...report, profile, context: ctx, dependencies: graph }, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes("--json");
  const filterSeverity = args.includes("--severity") ? args[args.indexOf("--severity") + 1] : null;

  const ctx = await buildContext();
  const profile = detectProfile(ctx);
  const graph = buildDependencyGraph();
  const features = ctx.features.migrated;
  const result = allChecks(features);

  const report = buildReport({ categories: result });

  if (isJson) {
    printJson(report, ctx, profile, graph);
  } else {
    printReport(report, ctx, profile, graph);
  }
}

main().catch(console.error);
