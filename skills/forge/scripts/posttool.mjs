#!/usr/bin/env node

/**
 * posttool.mjs — DEPRECATED: Backward-compat wrapper.
 *
 * Use forgeSentinel.mjs en su lugar.
 *   node forgeSentinel.mjs [options]
 *
 * Este wrapper delega en forgeSentinel.mjs para mantener compatibilidad
 * con scripts y referencias existentes.
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Re-export for backward compat
export { runSentinelCheck as postToolCheck } from "./forgeSentinel-lib.mjs";

if (process.argv[1]?.endsWith("posttool.mjs")) {
  const forgeSentinel = join(__dirname, "forgeSentinel.mjs");
  const args = process.argv.slice(2);
  const { execFileSync } = await import("child_process");
  try {
    execFileSync(process.execPath, [forgeSentinel, ...args], { stdio: "inherit" });
  } catch {
    process.exit(0);
  }
}
