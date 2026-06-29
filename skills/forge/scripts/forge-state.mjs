#!/usr/bin/env node

/**
 * forge-state.mjs — Wrapper de estado post-auditoría.
 *
 * Delega toda la lógica de persistencia en forge-config.mjs.
 * Existe como CLI independiente para compatibilidad con SKILL.md
 * y comandos ad-hoc.
 *
 * Uso:
 *   node forge-state.mjs --show
 *   node forge-state.mjs --save <score> <grade> <violations> <features> [migrated]
 *   node forge-state.mjs --history
 *   node forge-state.mjs --json
 */

import { loadState, saveState, saveHistory, loadHistory, displayTrend } from "./forge-config.mjs";
import { existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

async function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes("--json");

  if (args.includes("--show")) {
    const state = loadState();
    if (isJson) {
      console.log(JSON.stringify(state, null, 2));
    } else {
      console.log("── Forge State ──");
      for (const [k, v] of Object.entries(state)) {
        console.log(`  ${k}: ${v ?? "(sin datos)"}`);
      }
    }
    process.exit(0);
  }

  if (args.includes("--save")) {
    const scoreIdx = args.indexOf("--save") + 1;
    const score = parseInt(args[scoreIdx], 10);
    const grade = args[scoreIdx + 1] || "—";
    const violations = parseInt(args[scoreIdx + 2] || "0", 10);
    const features = parseInt(args[scoreIdx + 3] || "0", 10);
    const migrated = parseInt(args[scoreIdx + 4] || "0", 10);
    const platform = args.includes("--platform");

    const state = {
      lastAudit: new Date().toISOString(),
      lastScore: isNaN(score) ? null : score,
      lastGrade: grade,
      violationCount: isNaN(violations) ? 0 : violations,
      totalFeatures: isNaN(features) ? 0 : features,
      migratedFeatures: isNaN(migrated) ? 0 : migrated,
      legacyFeatures: isNaN(features) ? 0 : features - (isNaN(migrated) ? 0 : migrated),
      platformExists: platform || existsSync(join(ROOT, "src", "platform")),
      health: score >= 80 ? "healthy" : score >= 50 ? "fair" : "poor",
    };

    saveState(state);
    saveHistory({ score, grade, violationCount: state.violationCount, totalFeatures: features, migratedFeatures: migrated });

    if (isJson) {
      console.log(JSON.stringify({ saved: true, state }, null, 2));
    } else {
      console.log(`forge-state: estado guardado (score: ${score}, grade: ${grade})`);
    }
    process.exit(0);
  }

  if (args.includes("--history")) {
    const entries = loadHistory(isJson ? 999 : 20);
    if (isJson) {
      console.log(JSON.stringify(entries, null, 2));
    } else {
      displayTrend(entries);
    }
    process.exit(0);
  }

  // Default: show
  const state = loadState();
  const history = loadHistory(1);
  if (isJson) {
    console.log(JSON.stringify({ state, recentHistory: history }, null, 2));
  } else {
    const lastScore = state.lastScore !== null ? `${state.lastScore}/${state.lastMax || "?"}` : "—";
    const lastGrade = state.lastGrade || "—";
    console.log(`Forge State | Score: ${lastScore} | Grade: ${lastGrade} | Violaciones: ${state.violationCount} | Features: ${state.migratedFeatures}/${state.totalFeatures}`);
  }
  process.exit(0);
}

if (process.argv[1] && (process.argv[1].endsWith("forge-state.mjs") || process.argv[1].endsWith("forge-state.js"))) {
  main().catch(console.error);
}
