#!/usr/bin/env node

import { existsSync } from "fs";
import { join } from "path";
import { getGraph } from "./graph.mjs";
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
/**
 * Quickly check proposed content for common import violations
 * before the file is written to disk (preToolUse guard).
 */
function checkProposedContentViolations(filePath, content) {
  const violations = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match import/export from statements
    const importMatch = line.match(
      /(?:import|export)\s+(?:type\s+)?(?:\{[^}]*\}|[^;{]+?)\s+from\s+['"]([^'"]+)['"]/
    );
    if (!importMatch) continue;

    const src = importMatch[1];
    const lineNum = i + 1;

    // R10: Bare specifier — import from "domain/..." (no ./ ../ @/ prefix)
    if (
      !src.startsWith("./") &&
      !src.startsWith("../") &&
      !src.startsWith("@/") &&
      !src.startsWith("/") &&
      src.includes("/") &&
      !src.startsWith("tsyringe") &&
      !src.startsWith("reflect-metadata") &&
      !src.startsWith("express") &&
      !src.startsWith("node:") &&
      !src.startsWith("mongoose") &&
      !src.startsWith("prisma") &&
      src !== "tsyringe"
    ) {
      violations.push({
        severity: "CRITICAL",
        label: `[R10] Bare specifier — debe usar ./ o @/ prefix`,
        detail: `${filePath}:${lineNum} → "${src}"`,
        fix: `Agregar prefijo "./" o "@/" al import`,
      });
    }

    // R11: Import con extensión .ts en vez de .js
    if (src.endsWith(".ts") && !src.endsWith(".d.ts")) {
      violations.push({
        severity: "ERROR",
        label: `[R11] Import con extensión .ts — debe usar .js`,
        detail: `${filePath}:${lineNum} → "${src}"`,
        fix: src.replace(/\.ts$/, ".js"),
      });
    }

    // R12: import desde bootstrap.di.js
    if (src.includes("bootstrap.di")) {
      violations.push({
        severity: "CRITICAL",
        label: `[R12] Import a bootstrap.di.js — no existe en esta arquitectura`,
        detail: `${filePath}:${lineNum} → "${src}"`,
        fix: 'Usar "./di.js" (feature di.ts — fuente única de registro)',
      });
    }
  }

  // R12b: registerSingleton con model() (Mongoose)
  if (content.includes("registerSingleton") && content.includes("model(")) {
    violations.push({
      severity: "CRITICAL",
      label: `[R12] registerSingleton con model() — usar register({ useValue })`,
      detail: filePath,
      fix: 'container.register("Token", { useValue: Model as any })',
    });
  }

  return violations;
}

async function checkProposedFile(filePath, content) {
  if (!isSourceFile(filePath)) {
    return { violations: [], total: 0, hasCritical: false, hasErrors: false };
  }

  // Fast pre-check on proposed content (before it hits disk)
  const contentViolations = checkProposedContentViolations(filePath, content);
  if (contentViolations.length > 0) {
    const hasCritical = contentViolations.some(v => v.severity === "CRITICAL");
    const hasErrors = contentViolations.some(v => v.severity === "ERROR");
    return { violations: contentViolations, total: contentViolations.length, hasCritical, hasErrors };
  }

  const ctx = await buildContext();
  const features = detectFeaturesOnSrc();
  const graph = ctx.graph || getGraph();
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
