#!/usr/bin/env node

import { join, basename, relative } from "path";
import { execFileSync } from "child_process";
import { buildContext } from "./context.mjs";
import { detectProfile, detectProfileExtended } from "./profile.mjs";
import { buildDependencyGraph } from "./chain.mjs";
import { allChecks, checkStructure, checkLayers, checkDecorators, detectFeaturesOnSrc } from "./detect.mjs";
import { saveHistory, updateStateFromAudit } from "./forge-config.mjs";
import { buildPipeline, printPipeline } from "./recommendation-engine.mjs";

const ROOT = process.cwd();

import { CYAN, GREEN, RED, YELLOW, BOLD, RESET, DIM, GRAY, SEVERITY_COLORS, col, formatJson, formatCheck, scoreBar, formatReport } from "./formatter.mjs";

const CAT_NAMES = {
  structure: "Estructura",
  layers: "Capas",
  ownership: "Ownership",
  platform: "Platform",
  platformDomain: "Platform Domain",
  dependencies: "Dependencias",
  graph: "Grafo",
  importConventions: "Import Conventions",
};

const CAT_MAX = {
  structure: 30,
  layers: 25,
  decorators: 20,
  ownership: 20,
  platform: 15,
  platformDomain: 10,
  dependencies: 15,
  graph: 20,
  customRules: 5,
  naming: 10,
  importConventions: 20,
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

function printReport(report, ctx, profile, graph, archGraph, profileExtended) {
  const barLen = 40;
  const pct = report.max > 0 ? Math.round((report.total / report.max) * 100) : 0;

  function renderScoreBar(score, max) {
    const p = Math.min(max > 0 ? Math.round((score / max) * barLen) : 0, barLen);
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
  console.log(`   Platform:          ${ctx.platform.exists ? ctx.platform.components.join(", ") : "(no detectado)"}`);
  console.log(`   Shared:            ${ctx.shared.exists ? ctx.shared.components.join(", ") : "(no detectado)"}`);
  console.log(`   Infra:             ${ctx.infra.exists ? ctx.infra.components.join(", ") : "(no detectado)"}`);
  console.log(`   Dependencias:      ${graph.edges.length} edges entre ${graph.nodes.length} features`);
  if (graph.hasCycles) console.log(`   ${RED}Ciclos detectados en el grafo de dependencias${RESET}`);
  if (graph.edges.length > 0) {
    for (const edge of graph.edges) {
      console.log(`   ${GRAY}→ ${edge.source} depende de ${edge.target} (${edge.file})${RESET}`);
    }
  }

  /* Architecture Graph summary */
  if (archGraph) {
    const ag = archGraph.stats;
    console.log(`\n  ${BOLD}Grafo Arquitectónico${RESET}`);
    console.log(`   Nodos: ${ag.totalNodes} | Edges: ${ag.totalEdges} | Violaciones: ${ag.violations}`);
    console.log(`   Risk Score: ${ag.riskScore}/100 | Health: ${ag.health}`);
    console.log(`   Dependency Health: ${ag.dependencyHealth}%`);
    if (ag.layers) {
      console.log(`   Capas: Platform=${ag.layers.platform}, Feature=${ag.layers.feature}, Shared=${ag.layers.shared}, Infra=${ag.layers.infra}`);
    }
    if (ag.health === "critical") console.log(`   ${RED}⚠ Salud crítica — se requieren acciones correctivas${RESET}`);
  }
  console.log();

  /* Categories */
  for (const [key, cat] of Object.entries(report.categories)) {
    const name = CAT_NAMES[key] || key;
    const cmax = CAT_MAX[key] || cat.max || 10;
    console.log(`  ${BOLD}${name} (${cat.score}/${cmax})${RESET}`);
    console.log(`  ${renderScoreBar(cat.score, cmax)}`);

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

  /* Unified pipeline recommendation */
  const allViolations = [];
  for (const [, cat] of Object.entries(report.categories)) {
    for (const c of cat.checks) {
      if (!c.pass) allViolations.push(c);
    }
  }
  const pipeline = buildPipeline(allViolations, graph, ctx.ownership, profileExtended, ctx);
  if (pipeline.length > 0) {
    printPipeline(pipeline);
  }

  console.log("═".repeat(58) + "\n");
}

function printJson(report, ctx, profile, graph, archGraph) {
  console.log(JSON.stringify({ ...report, profile, context: ctx, dependencies: graph, architectureGraph: archGraph }, null, 2));
}

/**
 * Get files changed vs default branch (or working tree as fallback).
 */
function getChangedFiles() {
  // Try 1: changes vs default branch (committed but not merged)
  let files = [];
  try {
    const defaultBranch = execFileSync("git", ["symbolic-ref", "refs/remotes/origin/HEAD"], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] })
      .trim().replace("refs/remotes/origin/", "");
    const raw = execFileSync("git", ["diff", "--name-only", "--diff-filter=ACMR", `${defaultBranch}...HEAD`], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
    files = raw.trim().split("\n").filter(Boolean);
  } catch {}

  // Try 2: working tree changes (unstaged + uncommitted)
  if (files.length === 0) {
    try {
      const raw = execFileSync("git", ["status", "--porcelain"], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
      files = raw.split("\n").filter(Boolean).map(l => l.slice(3));
    } catch {}
  }

  // Try 3: staged changes only
  if (files.length === 0) {
    try {
      const raw = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
      files = raw.trim().split("\n").filter(Boolean);
    } catch {}
  }

  return files;
}

/**
 * Determine which features are affected by changed files.
 */
function getChangedFeatures(changedFiles, allFeatures) {
  if (changedFiles.length === 0) return [];
  const affected = new Set();
  for (const file of changedFiles) {
    const match = file.match(/src\/features\/([^/]+)\//);
    if (match) affected.add(match[1]);
  }
  return allFeatures.filter(f => affected.has(f));
}

async function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes("--json");
  const isDiff = args.includes("--diff");
  const isSummary = args.includes("--summary");
  const force = args.includes("--force");
  const filterSeverity = args.includes("--severity") ? args[args.indexOf("--severity") + 1] : null;

  const ctx = await buildContext(ROOT, null, { force });
  const profileExtended = detectProfileExtended(ctx);
  const profile = profileExtended.profile;
  const archGraph = ctx.graph;
  const chainGraph = buildDependencyGraph(process.cwd(), archGraph);
  const features = detectFeaturesOnSrc();

  if (isSummary) {
    const result = allChecks(features, archGraph, ctx);
    const report = buildReport({ categories: result });
    const pct = report.max > 0 ? Math.round((report.total / report.max) * 100) : 0;
    if (isJson) {
      console.log(JSON.stringify({
        score: report.total,
        max: report.max,
        pct,
        grade: pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 65 ? "C" : pct >= 50 ? "D" : "F",
        severityCounts: report.severityCounts,
        violations: report.violations.length,
        health: pct >= 80 ? "healthy" : pct >= 50 ? "fair" : "poor",
      }, null, 2));
    } else {
      console.log(`Score: ${report.total}/${report.max} (${pct}%) | Violations: ${report.violations.length} | Health: ${pct >= 80 ? "healthy" : pct >= 50 ? "fair" : "poor"}`);
    }
    return;
  }

  if (isDiff) {
    const changedFiles = getChangedFiles();
    const changedFeatures = getChangedFeatures(changedFiles, features);

    if (!isJson) {
      console.log(`\n${CYAN}═══ Diff-Aware Audit ═══${RESET}`);
      console.log(`${DIM}Archivos cambiados: ${changedFiles.length}${RESET}`);
      if (changedFiles.length > 0) {
        for (const f of changedFiles.slice(0, 10)) {
          console.log(`  ${DIM}${f}${RESET}`);
        }
        if (changedFiles.length > 10) console.log(`  ${DIM}... (+${changedFiles.length - 10})${RESET}`);
      }
    }

    if (changedFeatures.length === 0) {
      if (!isJson) {
        console.log(`\n${YELLOW}⚠ No hay features afectados por los cambios.${RESET}`);
        console.log(`${DIM}Los cambios están fuera de src/features/ o no hay features migrados.${RESET}`);
        console.log(`${DIM}Usá 'inspect --full' para un análisis completo de todo el proyecto.${RESET}\n`);
      } else {
        console.log(JSON.stringify({ diff: { changedFiles: changedFiles.length, changedFeatures: [], affectedFeatures: false } }));
      }
      process.exit(0);
    }

    if (!isJson) {
      console.log(`${DIM}Features afectados: ${changedFeatures.join(", ")}${RESET}\n`);
    }

    // Run only feature-specific checks on changed features
    const result = {
      structure: checkStructure(changedFeatures),
      layers: checkLayers(changedFeatures),
      decorators: checkDecorators(changedFeatures),
      graph: archGraph ? { score: 0, checks: [{ severity: "INFO", label: `Grafo: ${archGraph.stats.totalNodes} nodos, ${archGraph.stats.violations} violaciones (global)`, pass: true }] } : { score: 0, checks: [] },
    };

    // Provide a simpler report
    let totalScore = 0;
    let maxScore = 0;
    for (const [key, cat] of Object.entries(result)) {
      totalScore += cat.score;
      maxScore += CAT_MAX[key] || 20;
    }
    const pct = Math.round((totalScore / maxScore) * 100);

    if (!isJson) {
      console.log(`${BOLD}Score en features afectados: ${pct >= 80 ? GREEN : pct >= 50 ? YELLOW : RED}${totalScore}/${maxScore} (${pct}%)${RESET}\n`);

      for (const [key, cat] of Object.entries(result)) {
        const name = key.charAt(0).toUpperCase() + key.slice(1);
        const cmax = CAT_MAX[key] || cat.max || 20;
        console.log(`  ${BOLD}${name} (${cat.score}/${cat.score === 0 && cat.checks.length > 0 ? "—" : cmax})${RESET}`);
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
    } else {
      console.log(JSON.stringify({
        diff: { changedFiles: changedFiles.length, changedFeatures, totalScore, maxScore, pct },
        categories: result,
      }, null, 2));
    }
    updateStateFromAudit({ total: totalScore, max: maxScore, grade: `${pct}%`, violations: [], health: "diff", context: { features: { total: features.length, migrated: features, legacy: [] } } });
    saveHistory({ score: totalScore, grade: `${pct}%`, violationCount: 0, totalFeatures: features.length, migratedFeatures: features.length });
    process.exit(0);
  }

  const result = allChecks(features, archGraph, ctx);
  const report = buildReport({ categories: result });
  const pct = report.max > 0 ? Math.round((report.total / report.max) * 100) : 0;

  updateStateFromAudit({
    total: report.total,
    max: report.max,
    grade: pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 65 ? "C" : pct >= 50 ? "D" : "F",
    violations: report.violations || [],
    health: pct >= 80 ? "healthy" : pct >= 50 ? "fair" : "poor",
    context: { features: { total: features.length, migrated: features, legacy: ctx.features?.legacy || [] } },
  });
  saveHistory({
    score: report.total,
    grade: pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 65 ? "C" : pct >= 50 ? "D" : "F",
    violationCount: (report.violations || []).length,
    totalFeatures: features.length,
    migratedFeatures: features.length,
  });

  if (isJson) {
    printJson(report, ctx, profile, chainGraph, archGraph);
  } else {
    printReport(report, ctx, profile, chainGraph, archGraph, profileExtended);
  }
}

main().catch(console.error);
