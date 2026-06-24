#!/usr/bin/env node

import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, writeFileSync, readFileSync } from "fs";
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

function detectPM(configDir) {
  if (existsSync(join(configDir, "pnpm-lock.yaml")) || existsSync(join(process.cwd(), "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(configDir, "bun.lock")) || existsSync(join(configDir, "bun.lockb"))) return "bun";
  return "npm";
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

  const pm = detectPM(configDir);
  const order = { pnpm: ["npm", "bun"], npm: ["bun", "pnpm"], bun: ["npm", "pnpm"] };

  function runPM(bin) {
    execSync(`${bin} install`, { cwd: configDir, stdio: "pipe" });
  }

  try {
    runPM(pm);
    console.log(`  ✓ Dependencias instaladas (${pm})`);
  } catch {
    for (const fallback of order[pm]) {
      try {
        runPM(fallback);
        console.log(`  ✓ Dependencias instaladas (${fallback})`);
        return;
      } catch {}
    }
    console.warn("  ⚠ No se pudieron instalar dependencias. Ejecuta 'pnpm install' | 'npm install' manualmente en " + configDir);
  }
}

const COMMANDS = [
  { name: "forge-forge",   desc: "Forge — inicializar proyecto arquitectónicamente" },
  { name: "forge-cast",    desc: "Cast — crear un nuevo feature hexagonal desde cero" },
  { name: "forge-inspect", desc: "Inspect — inspeccionar la conformidad arquitectónica" },
  { name: "forge-relocate",desc: "Relocate — migrar feature legacy a la nueva estructura" },
  { name: "forge-reforge", desc: "Reforge — refactorizar la arquitectura de un feature" },
  { name: "forge-quench",  desc: "Quench — verificar reglas arquitectónicas del proyecto" },
  { name: "forge-temper",  desc: "Temper — endurecer la arquitectura (DI, seguridad)" },
  { name: "forge-chain",   desc: "Chain — analizar cadena de dependencias entre features" },
  { name: "forge-inscribe",desc: "Inscribe — generar y mantener ARCHITECTURE.md" },
  { name: "forge-smelt",   desc: "Smelt — extraer código reutilizable a shared/" },
];

function generateCommands(configDir) {
  const cmdsDir = join(configDir, "commands");
  mkdirSync(cmdsDir, { recursive: true });
  for (const cmd of COMMANDS) {
    const sub = cmd.name.replace("forge-", "");
    const content = [
      "---",
      `description: ${cmd.desc}`,
      "agent: build",
      "---",
      "",
      `Ejecuta el subcomando ${sub} de Forge con los argumentos: $ARGUMENTS`,
      "",
    ].join("\n");
    writeFileSync(join(cmdsDir, `${cmd.name}.md`), content);
  }
  console.log(`  ✓ Comandos /forge-* generados en .opencode/commands/`);
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
  generateCommands(configDir);
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
