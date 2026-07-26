#!/usr/bin/env node

/**
 * forge-bench.mjs — Benchmark suite for forge performance measurement.
 *
 * Uso:
 *   node forge-bench.mjs [--runs <n>] [--json]
 *
 * Mide tiempos de:
 *   - hashSrcDir() vs latestMtime()
 *   - buildContext() con y sin caché
 *   - getGraph() con y sin caché
 *   - allChecks()
 *   - Boot sequence completa (forge-boot.mjs)
 */

import { join } from "path";
import { performance } from "perf_hooks";

const ROOT = process.cwd();
const RUNS_DEFAULT = 5;

function formatMs(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function stats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  return { min, max, median, avg };
}

async function benchHashSrcDir(runs) {
  const { hashSrcDir } = await import("./forge-config.mjs");
  const times = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    hashSrcDir(ROOT);
    times.push(performance.now() - start);
  }
  return stats(times);
}

async function benchLatestMtime(runs) {
  const { latestMtime } = await import("./forge-config.mjs");
  if (!latestMtime) return null;
  const times = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    latestMtime(ROOT);
    times.push(performance.now() - start);
  }
  return stats(times);
}

async function benchBuildContextFresh(runs) {
  const { buildContext } = await import("./context.mjs");
  const times = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    await buildContext(ROOT, null, { force: true });
    times.push(performance.now() - start);
  }
  return stats(times);
}

async function benchBuildContextCached(runs) {
  const { buildContext } = await import("./context.mjs");
  // Prime cache
  await buildContext(ROOT, null, { force: true });
  const times = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    await buildContext(ROOT, null, { force: false });
    times.push(performance.now() - start);
  }
  return stats(times);
}

async function benchGetGraphFresh(runs) {
  const { getGraph } = await import("./graph.mjs");
  const times = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    getGraph(ROOT, { force: true });
    times.push(performance.now() - start);
  }
  return stats(times);
}

async function benchGetGraphCached(runs) {
  const { getGraph } = await import("./graph.mjs");
  getGraph(ROOT, { force: true });
  const times = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    getGraph(ROOT, { force: false });
    times.push(performance.now() - start);
  }
  return stats(times);
}

async function benchAllChecks(runs) {
  const { buildContext } = await import("./context.mjs");
  const { allChecks } = await import("./detect.mjs");
  const { getGraph } = await import("./graph.mjs");
  const ctx = await buildContext(ROOT, null, { force: true });
  const graph = getGraph(ROOT, { force: true });
  const features = ctx.features.migrated;
  const times = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    allChecks(features, graph, ctx);
    times.push(performance.now() - start);
  }
  return stats(times);
}

async function benchBootInProcessFresh(runs) {
  const { buildContext } = await import("./context.mjs");
  const { detectProfileExtended } = await import("./profile.mjs");
  const { buildDependencyGraph } = await import("./chain.mjs");
  const { allChecks } = await import("./detect.mjs");
  const times = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    const ctx = await buildContext(ROOT, null, { force: true });
    detectProfileExtended(ctx);
    buildDependencyGraph(ROOT, ctx.graph);
    allChecks(ctx.features.migrated, ctx.graph, ctx);
    times.push(performance.now() - start);
  }
  return stats(times);
}

async function benchBootInProcessCached(runs) {
  const { buildContext } = await import("./context.mjs");
  const { detectProfileExtended } = await import("./profile.mjs");
  const { buildDependencyGraph } = await import("./chain.mjs");
  const { allChecks } = await import("./detect.mjs");
  // Prime cache
  await buildContext(ROOT, null, { force: true });
  const times = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    const ctx = await buildContext(ROOT, null, { force: false });
    detectProfileExtended(ctx);
    buildDependencyGraph(ROOT, ctx.graph);
    allChecks(ctx.features.migrated, ctx.graph, ctx);
    times.push(performance.now() - start);
  }
  return stats(times);
}

async function benchBootFresh(runs) {
  const { execSync } = await import("child_process");
  const bootScript = join(import.meta.dirname, "forge-boot.mjs");
  const times = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    try {
      execSync(`node "${bootScript}" --depth full --json`, {
        cwd: ROOT,
        timeout: 30000,
        stdio: "pipe",
      });
    } catch {}
    times.push(performance.now() - start);
  }
  return stats(times);
}

async function benchBootCached(runs) {
  const { execSync } = await import("child_process");
  const bootScript = join(import.meta.dirname, "forge-boot.mjs");
  // Prime cache
  try {
    execSync(`node "${bootScript}" --depth full --json`, {
      cwd: ROOT,
      timeout: 30000,
      stdio: "pipe",
    });
  } catch {}
  const times = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    try {
      execSync(`node "${bootScript}" --depth full --json`, {
        cwd: ROOT,
        timeout: 30000,
        stdio: "pipe",
      });
    } catch {}
    times.push(performance.now() - start);
  }
  return stats(times);
}

async function main() {
  const args = process.argv.slice(2);
  const runs = args.includes("--runs") ? parseInt(args[args.indexOf("--runs") + 1]) || RUNS_DEFAULT : RUNS_DEFAULT;
  const isJson = args.includes("--json");

  console.log(`\nForge Benchmark — ${runs} runs each\n`);

  const results = {};

  console.log("Measuring hashSrcDir()...");
  results.hashSrcDir = await benchHashSrcDir(runs);
  console.log(`  ${formatMs(results.hashSrcDir.median)} (median) ${formatMs(results.hashSrcDir.min)}-${formatMs(results.hashSrcDir.max)}`);

  const latestMtimeResult = await benchLatestMtime(runs);
  if (latestMtimeResult) {
    results.latestMtime = latestMtimeResult;
    console.log(`  latestMtime(): ${formatMs(results.latestMtime.median)} (median) — ratio: ${(results.hashSrcDir.median / results.latestMtime.median).toFixed(1)}x faster`);
  }

  console.log("\nMeasuring buildContext()...");
  results.buildContextFresh = await benchBuildContextFresh(runs);
  console.log(`  fresh:  ${formatMs(results.buildContextFresh.median)} (median)`);
  results.buildContextCached = await benchBuildContextCached(runs);
  console.log(`  cached: ${formatMs(results.buildContextCached.median)} (median) — ratio: ${(results.buildContextFresh.median / results.buildContextCached.median).toFixed(1)}x faster`);

  console.log("\nMeasuring getGraph()...");
  results.graphFresh = await benchGetGraphFresh(runs);
  console.log(`  fresh:  ${formatMs(results.graphFresh.median)} (median)`);
  results.graphCached = await benchGetGraphCached(runs);
  console.log(`  cached: ${formatMs(results.graphCached.median)} (median) — ratio: ${(results.graphFresh.median / results.graphCached.median).toFixed(1)}x faster`);

  console.log("\nMeasuring allChecks()...");
  results.allChecks = await benchAllChecks(runs);
  console.log(`  ${formatMs(results.allChecks.median)} (median)`);

  console.log("\nMeasuring boot sequence (forge-boot.mjs --depth full)...");
  results.bootFresh = await benchBootFresh(runs);
  console.log(`  fresh:  ${formatMs(results.bootFresh.median)} (median)`);
  results.bootCached = await benchBootCached(runs);
  console.log(`  cached: ${formatMs(results.bootCached.median)} (median) — ratio: ${(results.bootFresh.median / results.bootCached.median).toFixed(1)}x faster`);

  console.log("\nMeasuring boot in-process (no spawn overhead)...");
  results.bootInProcessFresh = await benchBootInProcessFresh(runs);
  console.log(`  fresh:  ${formatMs(results.bootInProcessFresh.median)} (median)`);
  results.bootInProcessCached = await benchBootInProcessCached(runs);
  console.log(`  cached: ${formatMs(results.bootInProcessCached.median)} (median) — ratio: ${(results.bootInProcessFresh.median / results.bootInProcessCached.median).toFixed(1)}x faster`);

  console.log("\n── Summary ──");
  console.log(`  hashSrcDir:      ${formatMs(results.hashSrcDir.median)}`);
  if (results.latestMtime) {
    console.log(`  latestMtime:     ${formatMs(results.latestMtime.median)} (${(results.hashSrcDir.median / results.latestMtime.median).toFixed(1)}x)`);
  }
  console.log(`  context fresh:   ${formatMs(results.buildContextFresh.median)}`);
  console.log(`  context cached:  ${formatMs(results.buildContextCached.median)}`);
  console.log(`  graph fresh:     ${formatMs(results.graphFresh.median)}`);
  console.log(`  graph cached:    ${formatMs(results.graphCached.median)}`);
  console.log(`  allChecks:       ${formatMs(results.allChecks.median)}`);
  console.log(`  boot (spawn):    ${formatMs(results.bootFresh.median)} fresh / ${formatMs(results.bootCached.median)} cached`);
  console.log(`  boot (in-proc):  ${formatMs(results.bootInProcessFresh.median)} fresh / ${formatMs(results.bootInProcessCached.median)} cached`);
  console.log();

  if (isJson) {
    console.log(JSON.stringify(results, null, 2));
  }
}

if (process.argv[1] && (process.argv[1].endsWith("forge-bench.mjs") || process.argv[1].endsWith("forge-bench.js"))) {
  main().catch(console.error);
}
