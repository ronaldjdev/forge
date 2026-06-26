#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const FORGE_DIR = join(ROOT, ".forge");
const CONFIG_PATH = join(FORGE_DIR, "hooks-config.json");
const AUDIT_DIR = join(FORGE_DIR, "audit");

const DEFAULT_CONFIG = {
  forgeSentinel: { enabled: true },
  forgeSmith: { enabled: true },
};

function readConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      const data = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
      return { ...DEFAULT_CONFIG, ...data };
    }
  } catch {}
  return { ...DEFAULT_CONFIG };
}

function writeConfig(config) {
  mkdirSync(FORGE_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

function cmdStatus() {
  const config = readConfig();
  const auditPath = join(AUDIT_DIR, "forgeSentinel.json");
  let lastRun = null;
  try {
    if (existsSync(auditPath)) {
      const log = JSON.parse(readFileSync(auditPath, "utf-8"));
      if (Array.isArray(log) && log.length > 0) {
        lastRun = log[log.length - 1];
      }
    }
  } catch {}

  console.log("── forgeSmith-admin ──");
  console.log(`  forgeSentinel (PostToolUse): ${config.forgeSentinel.enabled ? "✓ activo" : "✘ inactivo"}`);
  console.log(`  forgeSmith (preToolUse):     ${config.forgeSmith.enabled ? "✓ activo" : "✘ inactivo"}`);
  if (lastRun) {
    console.log(`  Último forgeSentinel: ${lastRun.ts} (${lastRun.filesChecked || 0} archivos, ${lastRun.total || 0} violaciones)`);
  }
  console.log(`  Config: ${CONFIG_PATH}`);
}

function cmdOn(hookName) {
  const config = readConfig();
  if (hookName === "all" || hookName === "forgeSentinel") {
    config.forgeSentinel.enabled = true;
  }
  if (hookName === "all" || hookName === "forgeSmith") {
    config.forgeSmith.enabled = true;
  }
  writeConfig(config);
  console.log(`forgeSmith-admin: hooks activados (${hookName})`);
}

function cmdOff(hookName) {
  const config = readConfig();
  if (hookName === "all" || hookName === "forgeSentinel") {
    config.forgeSentinel.enabled = false;
  }
  if (hookName === "all" || hookName === "forgeSmith") {
    config.forgeSmith.enabled = false;
  }
  writeConfig(config);
  console.log(`forgeSmith-admin: hooks desactivados (${hookName})`);
}

function cmdReset() {
  writeConfig(DEFAULT_CONFIG);
  console.log("forgeSmith-admin: configuración restaurada a valores por defecto");
}

const [,, action, arg] = process.argv;

switch (action) {
  case "status":
    cmdStatus();
    break;
  case "on":
    cmdOn(arg || "all");
    break;
  case "off":
    cmdOff(arg || "all");
    break;
  case "reset":
    cmdReset();
    break;
  default:
    console.log("Uso: node forgeSmith-admin.mjs <status|on|off|reset> [hook-name]");
    console.log("\n  status              Mostrar estado de hooks");
    console.log("  on [forgeSentinel|forgeSmith|all]  Activar hook(s)");
    console.log("  off [forgeSentinel|forgeSmith|all] Desactivar hook(s)");
    console.log("  reset               Restaurar configuración por defecto");
    process.exit(1);
}
