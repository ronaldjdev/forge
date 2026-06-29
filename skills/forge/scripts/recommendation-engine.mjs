#!/usr/bin/env node

import { CYAN, GREEN, RED, YELLOW, BOLD, RESET, DIM, GRAY, SEVERITY_COLORS } from "./formatter.mjs";

function countByRule(violations) {
  const counts = {};
  for (const v of violations) {
    const rule = v.rule || "other";
    if (!counts[rule]) counts[rule] = [];
    counts[rule].push(v);
  }
  return counts;
}

export function buildPipeline(auditChecks, graph, ownership, profile, ctx) {
  const violations = auditChecks.filter(c => !c.pass);
  const pipeline = [];

  // --- CRITICAL: R2 (platform→feature) → forge temper ---
  const r2 = violations.filter(v => v.rule === "R2" || (v.fix && v.fix.includes("Extraer interfaz") && v.severity === "CRITICAL"));
  if (r2.length > 0) {
    pipeline.push({ command: "temper", args: "", priority: "CRITICAL", reason: `Corrige ${r2.length} violación(es) R2 (platform→feature)`, count: r2.length });
  }

  // --- ERROR: R3 (shared→feature) → forge reforge ---
  const r3 = violations.filter(v => v.rule === "R3" || (v.fix && v.fix.includes("Feature no accede")));
  // --- ERROR: R4 (shared→infra) → forge reforge ---
  const r4 = violations.filter(v => v.rule === "R4" || (v.fix && v.fix.includes("Feature no importa otro feature")));
  // --- ERROR: R8 (cross-feature) → forge reforge ---
  const r8 = violations.filter(v => v.rule === "R8");
  const sharedIssues = [...r3, ...r4, ...r8];
  if (sharedIssues.length > 0) {
    pipeline.push({ command: "reforge", args: "", priority: "ERROR", reason: `Corrige ${sharedIssues.length} violación(es) de capas (shared mal acoplado)`, count: sharedIssues.length });
  }

  // --- ERROR: R9 (cycles) → forge reforge ---
  const r9 = violations.filter(v => v.rule === "R9" || (v.label && v.label.includes("Ciclo")));
  if (r9.length > 0 || (graph && graph.hasCycles)) {
    pipeline.push({ command: "reforge", args: "--cycles", priority: "ERROR", reason: `Elimina ${r9.length || 1} ciclo(s) de dependencia (R9)`, count: r9.length || 1 });
  }

  // --- R1 (feature→infra) → forge reforge ---
  const r1 = violations.filter(v => v.rule === "R1");
  if (r1.length > 0) {
    pipeline.push({ command: "reforge", args: "", priority: "ERROR", reason: `Corrige ${r1.length} violación(es) R1 (feature→infra)`, count: r1.length });
  }

  // --- WARNING: orphan/misplaced → forge relocate ---
  const orphans = ownership?.orphans || [];
  const misplaced = ownership?.misplaced || [];
  const duplicates = ownership?.duplicates || [];
  const relocationCount = orphans.length + misplaced.length + duplicates.length;
  if (relocationCount > 0) {
    pipeline.push({ command: "relocate", args: "", priority: "WARNING", reason: `Migra ${relocationCount} componente(s) huérfanos/duplicados/mal ubicados`, count: relocationCount });
  }

  // --- WARNING: naming violations → forge reforge ---
  const namingCount = violations.filter(v => v.severity === "SUGGESTION" && v.label && v.label.includes("Naming")).length;
  if (namingCount > 0) {
    pipeline.push({ command: "reforge", args: "<filename>", priority: "WARNING", reason: `Corrige ${namingCount} violación(es) de naming (ejecutar por feature)`, count: namingCount });
  }

  // --- Legacy features → forge relocate ---
  const legacyCount = ctx?.features?.legacy?.length || 0;
  if (legacyCount > 0) {
    pipeline.push({ command: "relocate", args: "", priority: "WARNING", reason: `Migra ${legacyCount} feature(s) legacy a estructura hexagonal`, count: legacyCount });
  }

  // --- Missing platform → forge forge ---
  if (ctx && !ctx.platform?.exists) {
    pipeline.push({ command: "forge", args: "", priority: "INFO", reason: "Inicializa bootstrap de platform layer", count: 1 });
  }

  // --- Package dependencies → (not a forge command, just suggestion) ---
  const profileSugs = profile?.suggestions || [];
  if (profileSugs.length > 0) {
    pipeline.push({ command: "profile", args: "--install", priority: "SUGGESTION", reason: `${profileSugs.length} dependencia(s) sugeridas por perfil`, count: profileSugs.length });
  }

  // --- Verify & finalize ---
  if (pipeline.length > 0) {
    pipeline.push({ command: "quench", args: "", priority: "INFO", reason: "Verifica que todas las correcciones pasen", count: 0 });
    pipeline.push({ command: "inscribe", args: "", priority: "INFO", reason: "Actualiza ARCHITECTURE.md con el nuevo estado", count: 0 });
  }

  // Sort by priority
  const order = { CRITICAL: 0, ERROR: 1, WARNING: 2, INFO: 3, SUGGESTION: 4 };
  pipeline.sort((a, b) => (order[a.priority] ?? 99) - (order[b.priority] ?? 99));

  return pipeline;
}

export function printPipeline(pipeline) {
  if (!pipeline || pipeline.length === 0) return;
  console.log(`\n${BOLD}${CYAN}═══ Pipeline recomendado ═══${RESET}`);
  console.log(`${DIM}Para resolver los problemas encontrados, ejecuta en orden:${RESET}\n`);
  let step = 1;
  for (const item of pipeline) {
    const color = SEVERITY_COLORS[item.priority] || GRAY;
    const cmd = item.command === "forge" ? "forge forge" : `forge ${item.command}`;
    const args = item.args ? ` ${item.args}` : "";
    const countStr = item.count > 0 ? ` ${DIM}(${item.count})${RESET}` : "";
    console.log(` ${GREEN}${step}.${RESET} ${BOLD}${CYAN}${cmd}${args}${RESET} ${DIM}→${RESET} ${color}${item.reason}${countStr}${RESET}`);
    step++;
  }
  console.log();
}

export function pipelineToJson(pipeline) {
  return JSON.stringify({ pipeline }, null, 2);
}

/* ── CLI ── */
if (process.argv[1] && (process.argv[1].endsWith("recommendation-engine.mjs") || process.argv[1].endsWith("recommendation-engine.js"))) {
  const { buildContext } = await import("./context.mjs");
  const ctx = await buildContext();
  const features = ctx.features?.migrated || [];
  const graph = ctx.graph;
  const checks = [];
  for (const [, cat] of Object.entries(ctx.checks || {})) {
    if (cat.checks) checks.push(...cat.checks);
  }
  const pipeline = buildPipeline(checks, graph, ctx.ownership, ctx, ctx);
  printPipeline(pipeline);
}
