#!/usr/bin/env node

import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_DIR = join(__dirname, "..");
const SKILL_SRC = join(PKG_DIR, "skills", "forge");

function getTargetDir(global) {
  if (global) {
    const home = process.env.HOME || process.env.USERPROFILE;
    if (!home) {
      console.error("[ERROR] No se pudo determinar el HOME del usuario");
      process.exit(1);
    }
    return join(home, ".config", "opencode", "skills", "forge");
  }
  return join(process.cwd(), ".opencode", "skills", "forge");
}

function getConfigDir(global) {
  if (global) {
    const home = process.env.HOME || process.env.USERPROFILE;
    return join(home, ".config", "opencode");
  }
  return join(process.cwd(), ".opencode");
}

function copyRecursive(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function ensureDependencies(configDir) {
  const pkgPath = join(configDir, "package.json");
  let pkg = {};
  if (existsSync(pkgPath)) {
    try {
      pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    } catch {
      pkg = {};
    }
  }
  if (!pkg.dependencies) pkg.dependencies = {};
  if (!pkg.dependencies["@opencode-ai/plugin"]) {
    pkg.dependencies["@opencode-ai/plugin"] = "1.17.9";
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`  ✓ Actualizado ${relative(process.cwd(), pkgPath)}`);
  }
  try {
    execSync("npm install", { cwd: configDir, stdio: "pipe" });
    console.log("  ✓ Dependencias instaladas");
  } catch {
    try {
      execSync("bun install", { cwd: configDir, stdio: "pipe" });
      console.log("  ✓ Dependencias instaladas (bun)");
    } catch {
      console.warn("  ⚠ No se pudieron instalar dependencias. Ejecuta 'npm install' manualmente en " + configDir);
    }
  }
}

function printHelp() {
  console.log(`
Forge — Architecture OS

USO
  forge install                    Instalar skill en el proyecto actual
  forge install --global           Instalar globalmente (~/.config/opencode/)
  forge skills install             (alias del comando install)

OPCIONES
  -g, --global                     Instalar en ~/.config/opencode/skills/forge/
  -h, --help                       Mostrar esta ayuda
`);
}

function install(global) {
  if (!existsSync(SKILL_SRC)) {
    console.error("[ERROR] No se encuentra skills/forge/ en el paquete. ¿Corrupto?");
    process.exit(1);
  }

  const target = getTargetDir(global);
  const configDir = getConfigDir(global);

  console.log(`\n  Forge — Architecture OS`);
  console.log(`  ${"=".repeat(40)}`);
  console.log(`  Destino: ${target}\n`);

  copyRecursive(SKILL_SRC, target);
  console.log(`  ✓ Skill copiada a ${relative(process.cwd(), target)}`);
  ensureDependencies(configDir);
  console.log(`\n  ✓ Forge instalado correctamente`);
  console.log(`  ${"=".repeat(40)}\n`);
}

function main() {
  const args = process.argv.slice(2);
  const isHelp = args.includes("-h") || args.includes("--help");
  const isGlobal = args.includes("-g") || args.includes("--global");

  if (isHelp) {
    printHelp();
    return;
  }

  const subcommandIndex = args.indexOf("skills");
  const command = subcommandIndex !== -1 ? args[subcommandIndex + 1] : args[0];

  if (command === "install") {
    install(isGlobal);
  } else {
    printHelp();
    process.exit(1);
  }
}

main();
