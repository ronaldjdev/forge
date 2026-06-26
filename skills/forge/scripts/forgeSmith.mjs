#!/usr/bin/env node

import { existsSync } from "fs";
import { join } from "path";
import { buildGraph } from "./graph.mjs";
import { buildContext } from "./context.mjs";
import { detectFeaturesOnSrc, allChecks } from "./detect.mjs";
import { evaluateRules } from "./registry/rules.mjs";
import {
  CYAN, GREEN, RED, YELLOW, BOLD, RESET, DIM,
} from "./formatter.mjs";
import { writeAuditLog } from "./forgeSentinel-lib.mjs";

const ROOT = process.cwd();

const ALLOWED_EXTS = [".ts", ".mjs", ".js", ".tsx", ".jsx"];

/**
 * Parse Cursor preToolUse event from stdin.
 * Cursor sends: { toolName, args: { filePath, content } }
 */
function parseCursorEvent(stdin) {
  if (!stdin) return null;
  try {
    const event = JSON.parse(stdin);

    // Cursor preToolUse format
    if (event.toolName && event.args?.filePath) {
      return { filePath: event.args.filePath, content: event.args.content || "" };
    }

    // Alternative: direct filePath + content
    if (event.filePath && event.content !== undefined) {
      return { filePath: event.filePath, content: event.content };
    }

    // Array of proposed edits
    if (Array.isArray(event.edits)) {
      return event.edits.map(e => ({
        filePath: e.filePath || e.path || "",
        content: e.content || e.newContent || "",
      })).filter(e => e.filePath)[0] || null;
    }

    return null;
  } catch {
    return null;
  }
}

function isSourceFile(filePath) {
  return filePath.startsWith("src/") && ALLOWED_EXTS.some(ext => filePath.endsWith(ext));
}

function hasCriticalViolations(result) {
  return result.violations.some(v => v.severity === "CRITICAL" || v.severity === "ERROR");
}

/**
 * Quick check against proposed content.
 * Returns violations that would be introduced by the proposed content.
 */
async function checkProposedFile(filePath, content) {
  if (!isSourceFile(filePath)) {
    return { violations: [], total: 0, hasCritical: false, hasErrors: false };
  }

  const ctx = await buildContext();
  const features = detectFeaturesOnSrc();
  const graph = buildGraph(ROOT);
  const results = allChecks(features, graph, ctx);

  const violations = [];
  for (const [, cat] of Object.entries(results)) {
    for (const check of cat.checks) {
      if (check.pass) continue;

      const touchesFile = (check.detail && check.detail.includes(filePath)) ||
                          (check.label && check.label.includes(filePath));

      if (!touchesFile) continue;

      violations.push(check);
    }
  }

  const graphViolations = evaluateRules(graph, ctx).filter(v => {
    return (v.file && v.file.includes(filePath)) ||
           (v.from && v.from.includes(filePath)) ||
           (v.to && v.to.includes(filePath));
  });

  const allViolations = [...violations, ...graphViolations];
  const hasCritical = allViolations.some(v => v.severity === "CRITICAL");
  const hasErrors = allViolations.some(v => v.severity === "ERROR");

  return { violations: allViolations, total: allViolations.length, hasCritical, hasErrors };
}

function buildDenyPayload(result) {
  const criticalCount = result.violations.filter(v => v.severity === "CRITICAL").length;
  const errorCount = result.violations.filter(v => v.severity === "ERROR").length;

  return {
    deny: true,
    severity: criticalCount > 0 ? "CRITICAL" : "ERROR",
    message: `[forgeSmith] ⚠ ${result.total} violación(es) arquitectónica(s) (${criticalCount} CRITICAL, ${errorCount} ERROR). Corregí antes de escribir.`,
    violations: result.violations.slice(0, 10).map(v => ({
      severity: v.severity,
      label: v.label,
      rule: v.rule,
      fix: v.fix,
    })),
  };
}

function buildAllowPayload() {
  return { deny: false };
}

async function main() {
  const chunks = [];
  if (!process.stdin.isTTY) {
    for await (const chunk of process.stdin) chunks.push(chunk);
  }
  const stdin = Buffer.concat(chunks).toString("utf-8");

  if (!stdin) {
    process.stdout.write(JSON.stringify(buildAllowPayload()));
    process.exit(0);
  }

  const edit = parseCursorEvent(stdin);
  if (!edit || !edit.filePath) {
    process.stdout.write(JSON.stringify(buildAllowPayload()));
    process.exit(0);
  }

  const result = await checkProposedFile(edit.filePath, edit.content || "");

  writeAuditLog(process.env, {
    ts: new Date().toISOString(),
    hook: "forgeSmith",
    file: edit.filePath,
    total: result.total,
    hasCritical: result.hasCritical,
    hasErrors: result.hasErrors,
  }, ROOT);

  if (result.total > 0 && hasCriticalViolations(result)) {
    process.stdout.write(JSON.stringify(buildDenyPayload(result)));
  } else {
    process.stdout.write(JSON.stringify(buildAllowPayload()));
  }

  process.exit(0);
}

if (process.argv[1]?.endsWith("forgeSmith.mjs")) {
  main().catch(() => {
    process.stdout.write(JSON.stringify({ deny: false }));
    process.exit(0);
  });
}
