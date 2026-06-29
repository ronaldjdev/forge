#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { getGraph } from "./graph.mjs";
import { buildContext } from "./context.mjs";
import { detectFeaturesOnSrc, allChecks, loadAllInlineIgnores, isIgnored } from "./detect.mjs";
import { evaluateRules } from "./registry/rules.mjs";

const ROOT = process.cwd();

export async function runSentinelCheck(files, opts = {}) {
  const { strict = false, reminder = false } = opts;

  if (!files || files.length === 0) {
    return { violations: [], graphViolations: [], total: 0, hasCritical: false, hasErrors: false, filesChecked: 0, summary: "Sin archivos fuente modificados" };
  }

  const ctx = await buildContext();
  const features = detectFeaturesOnSrc();
  const graph = ctx.graph || getGraph();
  const results = allChecks(features, graph, ctx);

  const allIgnores = loadAllInlineIgnores(join(ROOT, "src"));

  const violations = [];
  for (const [, cat] of Object.entries(results)) {
    for (const check of cat.checks) {
      if (check.pass) continue;

      const touchesFile = files.some(f =>
        (check.detail && check.detail.includes(f)) ||
        (check.label && check.label.includes(f))
      );

      if (!touchesFile && !reminder) continue;

      if (isIgnored(check, allIgnores)) continue;

      violations.push(check);
    }
  }

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

export function writeAuditLog(env, data, cwd) {
  try {
    const dir = join(cwd, ".forge", "audit");
    mkdirSync(dir, { recursive: true });
    const path = join(dir, "forgeSentinel.json");
    const log = [];
    if (existsSync(path)) {
      try {
        const existing = JSON.parse(readFileSync(path, "utf-8"));
        if (Array.isArray(existing)) log.push(...existing);
      } catch {}
    }
    log.push({ ...data, ts: data.ts || new Date().toISOString() });
    writeFileSync(path, JSON.stringify(log, null, 2) + "\n", "utf-8");
  } catch {}
}
