#!/usr/bin/env node

/**
 * forge-boot.mjs — Boot orchestrator with conditional depth.
 *
 * Uso:
 *   node forge-boot.mjs --depth minimal|standard|full [--command <name>] [--json] [--force] [--bench]
 *
 * Profundidades:
 *   minimal  → context + profile (cast, temper, smelt, relocate, reforge, inscribe)
 *   standard → minimal + graph + chain (chain, graph)
 *   full     → standard + ownership + inspect (inspect, quench, default)
 *
 * Cache:
 *   Usa .forge/cache/ para reusar datos entre invocaciones.
 *   Pasa --force para ignorar caché y regenerar todo.
 */

import { join } from "path";
import { performance } from "perf_hooks";

const ROOT = process.cwd();

function formatMs(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function main() {
  const args = process.argv.slice(2);
  const depth = args.includes("--depth")
    ? args[args.indexOf("--depth") + 1]
    : "full";
  const isJson = args.includes("--json");
  const force = args.includes("--force");
  const bench = args.includes("--bench");

  const t0 = performance.now();
  const timings = {};
  function mark(label) {
    if (bench) timings[label] = performance.now();
  }
  function elapsed(label) {
    if (bench && timings[label]) return formatMs(performance.now() - timings[label]);
    return "";
  }

  const result = { depth, bootTime: Date.now(), context: null, profile: null, graph: null, chain: null, ownership: null, inspect: null };

  // 1. Context
  mark("context");
  const { buildContext } = await import("./context.mjs");
  const ctx = await buildContext(ROOT, null, { force });
  result.context = ctx;
  timings.context = elapsed("context");

  // 2. Profile
  mark("profile");
  const { detectProfile, detectProfileExtended } = await import("./profile.mjs");
  const profileExtended = detectProfileExtended(ctx);
  result.profile = {
    profile: profileExtended.profile,
    hasPlatform: profileExtended.hasPlatform,
    hasShared: profileExtended.hasShared,
    hasInfra: profileExtended.hasInfra,
    layers: profileExtended.layers,
    complementary: profileExtended.complementary,
  };
  timings.profile = elapsed("profile");

  if (depth === "minimal") {
    timings.total = formatMs(performance.now() - t0);
    if (isJson) {
      if (bench) result.timings = timings;
      return console.log(JSON.stringify(result, null, 2));
    }
    console.log(`Boot [${depth}]: ${result.profile.profile} | ${ctx.features.total} features | ${ctx.framework} | ${ctx.database}`);
    if (bench) console.log(`  Timings: context=${timings.context} profile=${timings.profile} total=${timings.total}`);
    return;
  }

  // 3. Graph
  result.graph = ctx.graph;

  // 4. Chain
  mark("chain");
  const { buildDependencyGraph } = await import("./chain.mjs");
  const chain = buildDependencyGraph(ROOT, result.graph);
  result.chain = {
    features: chain.features.length,
    hasCycles: chain.hasCycles,
    globalCycles: chain.globalCycles,
    illegalChains: chain.illegalChains.length,
    isolated: chain.isolated.length,
    topologicalOrder: chain.topologicalOrder,
  };
  timings.chain = elapsed("chain");

  if (depth === "standard") {
    timings.total = formatMs(performance.now() - t0);
    if (isJson) {
      if (bench) result.timings = timings;
      return console.log(JSON.stringify(result, null, 2));
    }
    console.log(`Boot [${depth}]: ${result.profile.profile} | ${ctx.features.total} features | ${result.graph.stats.totalNodes} nodes | chains: ${result.chain.illegalChains}`);
    if (bench) console.log(`  Timings: context=${timings.context} profile=${timings.profile} chain=${timings.chain} total=${timings.total}`);
    return;
  }

  // 5. Ownership (from context)
  result.ownership = {
    health: ctx.ownership?.health || "unknown",
    score: ctx.ownership?.score || 0,
    orphans: ctx.ownership?.orphans?.length || 0,
    duplicates: ctx.ownership?.duplicates?.length || 0,
    misplaced: ctx.ownership?.misplaced?.length || 0,
    hasPlatform: ctx.ownership?.hasPlatform || false,
    hasFeatures: ctx.ownership?.hasFeatures || false,
  };

  // 6. Inspect (full audit)
  mark("inspect");
  const { allChecks } = await import("./detect.mjs");
  const checks = allChecks(ctx.features.migrated, result.graph, ctx);
  const violations = [];
  for (const [catName, cat] of Object.entries(checks)) {
    for (const check of cat.checks) {
      if (!check.pass) violations.push({ severity: check.severity, label: check.label, category: catName });
    }
  }
  result.inspect = {
    totalChecks: violations.length,
    critical: violations.filter(v => v.severity === "CRITICAL").length,
    errors: violations.filter(v => v.severity === "ERROR").length,
    warnings: violations.filter(v => v.severity === "WARNING").length,
  };
  timings.inspect = elapsed("inspect");
  timings.total = formatMs(performance.now() - t0);

  if (isJson) {
    if (bench) result.timings = timings;
    return console.log(JSON.stringify(result, null, 2));
  }
  console.log(`Boot [${depth}]: ${result.profile.profile} | features: ${ctx.features.total} | graph: ${result.graph.stats.totalNodes}n/${result.graph.stats.totalEdges}e | violations: ${result.inspect.totalChecks} [CRIT:${result.inspect.critical} ERR:${result.inspect.errors} WARN:${result.inspect.warnings}]`);
  if (bench) console.log(`  Timings: context=${timings.context} profile=${timings.profile} chain=${timings.chain} inspect=${timings.inspect} total=${timings.total}`);
}

if (process.argv[1] && (process.argv[1].endsWith("forge-boot.mjs") || process.argv[1].endsWith("forge-boot.js"))) {
  main().catch(console.error);
}
