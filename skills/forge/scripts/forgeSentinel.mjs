#!/usr/bin/env node

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { buildGraph } from "./graph.mjs";
import { buildContext } from "./context.mjs";
import { detectFeaturesOnSrc, allChecks, loadAllInlineIgnores, isIgnored } from "./detect.mjs";
import { evaluateRules } from "./registry/rules.mjs";
import {
  CYAN, GREEN, RED, YELLOW, BOLD, RESET, DIM,
  formatCheck, formatJson,
} from "./formatter.mjs";
import { runSentinelCheck, writeAuditLog } from "./forgeSentinel-lib.mjs";

const ROOT = process.cwd();

function getChangedFiles() {
  let files = [];
  try {
    const defaultBranch = execFileSync("git", ["symbolic-ref", "refs/remotes/origin/HEAD"], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] })
      .trim().replace("refs/remotes/origin/", "");
    const raw = execFileSync("git", ["diff", "--name-only", "--diff-filter=ACMR", `${defaultBranch}...HEAD`], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
    files = raw.trim().split("\n").filter(Boolean);
  } catch {}

  if (files.length === 0) {
    try {
      const raw = execFileSync("git", ["status", "--porcelain"], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
      files = raw.split("\n").filter(Boolean).map(l => l.slice(3));
    } catch {}
  }

  return files.filter(f => f.startsWith("src/"));
}

function parseHookEvent(stdin) {
  if (!stdin) return null;
  try {
    const event = JSON.parse(stdin);
    let files = [];

    // Claude Code format: { toolUse: { name, input: { filePath, content } } }
    if (event.toolUse?.input?.filePath) {
      files = [event.toolUse.input.filePath];
    }

    // Cursor/Codex format: may have files array or filePath property
    if (Array.isArray(event.files)) {
      files = event.files.map(f => typeof f === "string" ? f : f.filePath).filter(Boolean);
    }
    if (event.filePath) {
      files.push(event.filePath);
    }

    return files.length > 0 ? [...new Set(files)] : null;
  } catch {
    return null;
  }
}

function printResult(result, opts = {}) {
  const { reminder = false, hook = false } = opts;

  const prefix = hook ? "" : `\n${BOLD}${CYAN}═══ forgeSentinel ═══${RESET}`;
  if (!hook) console.log(prefix);

  if (result.total === 0) {
    if (!hook) {
      console.log(` ${GREEN}✔${RESET} Sin violaciones arquitectónicas en archivos modificados`);
      console.log(` ${DIM}Archivos revisados: ${result.filesChecked}${RESET}\n`);
    }
    return;
  }

  if (reminder || hook) {
    if (!hook) {
      console.log(`  ${YELLOW}Recordatorio:${RESET} ${result.total} violación(es) arquitectónica(s).`);
      console.log(`  Ejecuta ${CYAN}forge quench${RESET} para ver el detalle completo.\n`);
    }

    if (result.hasCritical) {
      const c = result.violations.filter(v => v.severity === "CRITICAL").length;
      if (hook) {
        const lines = [`[forgeSentinel] ⚠ ${c} CRITICAL, ${result.violations.filter(v => v.severity === "ERROR").length} ERROR`];
        const toShow = result.violations.slice(0, 5);
        for (const v of toShow) {
          lines.push(`  [${v.severity}] ${v.label}${v.file ? ` (${v.file})` : ""}`);
        }
        if (result.violations.length > 5) {
          lines.push(`  ${DIM}... y ${result.violations.length - 5} más. Ejecutá 'forge quench' para el detalle completo.${RESET}`);
        }
        console.log(lines.join("\n"));
      } else {
        console.log(`  ${RED}⚠ ${c} violación(es) CRITICAL detectadas${RESET}`);
      }
    }
    if (result.hasErrors) {
      const e = result.violations.filter(v => v.severity === "ERROR").length;
      console.log(`  ${RED}⚠ ${e} violación(es) ERROR detectadas${RESET}`);
    }

    if (!hook) {
      const toShow = result.violations.slice(0, 5);
      for (const v of toShow) {
        console.log(formatCheck(v));
      }
      if (result.violations.length > 5) {
        console.log(`  ${DIM}... y ${result.violations.length - 5} más${RESET}`);
      }
      console.log();
    }
    return;
  }

  for (const v of result.violations) {
    console.log(formatCheck(v));
  }

  console.log(`\n  ${BOLD}Resumen:${RESET} ${result.summary}`);
  if (result.hasCritical) {
    console.log(`  ${RED}⚠ Se requiere acción correctiva antes de continuar${RESET}`);
  }
  console.log();
}

async function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes("--json");
  const isHook = args.includes("--hook");
  const reminder = args.includes("--reminder");
  const isDiff = args.includes("--diff");

  let files;
  if (isHook) {
    const chunks = [];
    if (!process.stdin.isTTY) {
      for await (const chunk of process.stdin) chunks.push(chunk);
    }
    const stdin = Buffer.concat(chunks).toString("utf-8");
    const hookFiles = parseHookEvent(stdin);
    if (hookFiles) {
      files = hookFiles;
    }
  }

  if (!files || files.length === 0) {
    if (isDiff) {
      files = getChangedFiles();
    } else {
      files = args.filter(a => !a.startsWith("--"));
      if (files.length === 0) {
        files = getChangedFiles();
      }
    }
  }

  files = (files || []).filter(f =>
    f.endsWith(".ts") || f.endsWith(".mjs") || f.endsWith(".js") || f.endsWith(".tsx")
  );

  const result = await runSentinelCheck(files, { strict: false, reminder: reminder || isHook });

  writeAuditLog(process.env, {
    ts: new Date().toISOString(),
    hook: isHook ? "forgeSentinel" : "cli",
    total: result.total,
    hasCritical: result.hasCritical,
    hasErrors: result.hasErrors,
    filesChecked: result.filesChecked,
  }, ROOT);

  if (isJson) {
    console.log(formatJson(result));
  } else {
    printResult(result, { reminder: reminder || isHook, hook: isHook });
  }

  process.exit(0);
}

if (process.argv[1]?.endsWith("forgeSentinel.mjs")) {
  main().catch(() => process.exit(0));
}
