#!/usr/bin/env node

import { execFileSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { loadConfig, loadState } from "./forge-config.mjs";

const ROOT = process.cwd();

function gitSignals(cwd) {
  const run = (args, { trim = true } = {}) => {
    try {
      const out = execFileSync("git", args, { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
      return trim ? out.trim() : out;
    } catch {
      return null;
    }
  };

  const branch = run(["rev-parse", "--abbrev-ref", "HEAD"]);
  const defaultBranch = run(["symbolic-ref", "refs/remotes/origin/HEAD"])?.replace("refs/remotes/origin/", "") || "main";
  const topLevel = run(["rev-parse", "--show-toplevel"]);

  let changedFiles = [];
  try {
    const raw = run(["diff", "--name-only", "--diff-filter=ACMR", `${defaultBranch}...HEAD`], { trim: false });
    if (raw) changedFiles = raw.split("\n").filter(Boolean);
  } catch {
    // fallback to working tree
    try {
      const raw = run(["status", "--porcelain"]);
      if (raw) changedFiles = raw.split("\n").filter(Boolean).map(l => l.slice(3));
    } catch {}
  }

  return {
    branch: branch ?? "unknown",
    defaultBranch,
    changedFiles,
    hasChanges: changedFiles.length > 0,
    isRepo: branch !== null,
    topLevel,
  };
}

function contextSignals(cwd) {
  const config = loadConfig();
  const state = loadState();

  const hasFeatures = existsSync(join(cwd, "src", "features"));
  const hasPlatform = existsSync(join(cwd, "src", "platform"));
  const hasShared = existsSync(join(cwd, "src", "shared"));
  const hasInfra = existsSync(join(cwd, "src", "infra"));
  const hasLegacy = existsSync(join(cwd, "src", "application")) || existsSync(join(cwd, "src", "adapters", "in", "http", "controllers"));

  return {
    setup: {
      hasFeatures,
      hasPlatform,
      hasShared,
      hasInfra,
      hasLegacy,
      hasSrc: existsSync(join(cwd, "src")),
      hasPackageJson: existsSync(join(cwd, "package.json")),
    },
    config: {
      exists: !!config.profile,
      profile: config.profile,
      framework: config.framework,
      needsRefresh: config.lastContextUpdate ? (Date.now() - new Date(config.lastContextUpdate).getTime()) / 86400000 > 7 : true,
    },
    audit: {
      lastScore: state.lastScore,
      lastGrade: state.lastGrade,
      lastAudit: state.lastAudit,
      violationCount: state.violationCount,
      health: state.health,
      totalFeatures: state.totalFeatures,
      migratedFeatures: state.migratedFeatures,
      legacyFeatures: state.legacyFeatures,
      hasAudit: !!state.lastAudit,
    },
  };
}

function buildSignals(cwd) {
  const signals = {};

  // Check tsconfig exists
  signals.hasTsConfig = existsSync(join(cwd, "tsconfig.json"));

  // Check for common build artifacts
  signals.hasDist = existsSync(join(cwd, "dist"));
  signals.hasNext = existsSync(join(cwd, ".next"));

  return signals;
}

async function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes("--json");
  const isMinimal = args.includes("--minimal");

  const git = gitSignals(ROOT);
  const ctx = contextSignals(ROOT);
  const build = buildSignals(ROOT);

  const signals = { git, context: ctx, build };

  if (isJson) {
    console.log(JSON.stringify(signals, null, 2));
  } else if (isMinimal) {
    const lines = [];
    if (git.branch) lines.push(`Branch: ${git.branch}`);
    if (git.hasChanges) lines.push(`Cambios: ${git.changedFiles.length} archivos`);
    if (ctx.audit.hasAudit) lines.push(`Score: ${ctx.audit.lastGrade} (${ctx.audit.lastScore})`);
    if (!ctx.setup.hasFeatures) lines.push("⚠ Sin src/features/");
    if (ctx.config.needsRefresh) lines.push("⚠ Config necesita refresco");
    lines.push(`Features: ${ctx.audit.migratedFeatures} migrados + ${ctx.audit.legacyFeatures} legacy = ${ctx.audit.totalFeatures} total`);
    console.log(lines.join(" | "));
  } else {
    console.log("── Forge Signals ──");
    console.log(`Git: ${git.branch} (${git.changedFiles.length} cambios)`);
    console.log(`Audit: ${ctx.audit.lastGrade ?? "—"} (${ctx.audit.lastScore ?? "—"}) — ${ctx.audit.health}`);
    console.log(`Features: ${ctx.audit.totalFeatures} total (${ctx.audit.migratedFeatures} migrados, ${ctx.audit.legacyFeatures} legacy)`);
    console.log(`Layers: platform=${ctx.setup.hasPlatform} shared=${ctx.setup.hasShared} infra=${ctx.setup.hasInfra}`);
    console.log(`Config: ${ctx.config.profile ?? "pendiente"} | Refresh: ${ctx.config.needsRefresh ? "necesario" : "ok"}`);
  }
}

main().catch(console.error);
