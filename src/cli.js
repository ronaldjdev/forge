#!/usr/bin/env node

import { copyFileSync, mkdirSync, existsSync, writeFileSync, readFileSync, cpSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { spinner, log } from "@clack/prompts";
import { runWizard } from "./wizard.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_SRC = join(__dirname, "..", "skills", "forge");
const AGENTS_TEMPLATES = join(SKILL_SRC, "templates", "agents");

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
  cpSync(src, dest, { recursive: true, force: true });
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
  }

  const pm = detectPM(configDir);
  const order = { pnpm: ["npm", "bun"], npm: ["bun", "pnpm"], bun: ["npm", "pnpm"] };

  function runPM(bin) {
    execSync(`${bin} install`, { cwd: configDir, stdio: "pipe" });
  }

  try {
    runPM(pm);
  } catch {
    for (const fallback of order[pm]) {
      try {
        runPM(fallback);
        return;
      } catch { }
    }
    log.warn("No se pudieron instalar dependencias. Ejecutá 'pnpm install' | 'npm install' manualmente en " + configDir);
  }
}

const COMMANDS = [
  { name: "forge-forge", desc: "Forge — inicializar proyecto arquitectónicamente" },
  { name: "forge-cast", desc: "Cast — crear un nuevo feature hexagonal desde cero" },
  { name: "forge-inspect", desc: "Inspect — inspeccionar la conformidad arquitectónica" },
  { name: "forge-relocate", desc: "Relocate — migrar feature legacy a la nueva estructura" },
  { name: "forge-reforge", desc: "Reforge — refactorizar la arquitectura de un feature" },
  { name: "forge-quench", desc: "Quench — verificar reglas arquitectónicas del proyecto" },
  { name: "forge-temper", desc: "Temper — endurecer la arquitectura (DI, seguridad)" },
  { name: "forge-chain", desc: "Chain — analizar cadena de dependencias entre features" },
  { name: "forge-inscribe", desc: "Inscribe — generar y mantener ARCHITECTURE.md" },
  { name: "forge-smelt", desc: "Smelt — extraer código reutilizable a shared/" },
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
}

// --- Direct installers ---

async function installOpenCode(isGlobal = false) {
  if (!existsSync(SKILL_SRC)) {
    log.error("No se encuentra skills/forge/ en el paquete. ¿Corrupto?");
    process.exit(1);
  }

  const target = getTargetDir(isGlobal);
  const configDir = getConfigDir(isGlobal);
  const rel = relative(process.cwd(), target);

  const s = spinner();

  s.start("Copiando skill a " + rel);
  copyRecursive(SKILL_SRC, target);
  s.stop("Skill copiada a " + rel);

  s.start("Generando comandos /forge-*");
  generateCommands(configDir);
  s.stop("Comandos generados en " + relative(process.cwd(), join(configDir, "commands")));

  s.start("Instalando dependencias");
  ensureDependencies(configDir);
  s.stop("Dependencias instaladas");

  log.success("OpenCode configurado correctamente");
}

async function installCursor() {
  const src = join(AGENTS_TEMPLATES, "cursor", ".cursorrules");
  const dest = join(process.cwd(), ".cursorrules");

  if (!existsSync(src)) {
    log.error("Template .cursorrules no encontrado");
    process.exit(1);
  }

  const s = spinner();
  s.start("Creando .cursorrules");
  copyFileSync(src, dest);
  s.stop(".cursorrules creado");

  log.success("Cursor configurado correctamente");
}

async function installClaude() {
  const claudeDir = join(process.cwd(), ".claude");
  const src = join(AGENTS_TEMPLATES, "claude", "CLAUDE.md");
  const dest = join(claudeDir, "CLAUDE.md");

  if (!existsSync(src)) {
    log.error("Template CLAUDE.md no encontrado");
    process.exit(1);
  }

  const s = spinner();
  s.start("Creando .claude/CLAUDE.md");
  mkdirSync(claudeDir, { recursive: true });
  copyFileSync(src, dest);
  s.stop(".claude/CLAUDE.md creado");

  log.success("Claude Code configurado correctamente");
}

async function installAgents(selected, isGlobal = false) {
  for (const agent of selected) {
    switch (agent) {
      case "opencode":
        await installOpenCode(isGlobal);
        break;
      case "cursor":
        await installCursor();
        break;
      case "claude":
        await installClaude();
        break;
    }
  }
}

// --- CLI ---

function printHelp() {
  console.log(`
⚔️ Forge — Architecture OS

USO
  forge install                    Mostrar wizard interactivo de instalación
  forge install --opencode         Instalar solo para OpenCode
  forge install --cursor           Instalar solo para Cursor
  forge install --claude           Instalar solo para Claude Code
  forge install --all              Instalar para todos los agentes
  forge install --global           Instalar OpenCode globalmente (~/.config/opencode/)
  forge install --help             Mostrar esta ayuda

OPCIONES
  -g, --global                     Instalar OpenCode en ~/.config/opencode/skills/forge/
  -h, --help                       Mostrar esta ayuda
`);
}

async function main() {
  const args = process.argv.slice(2);
  const isHelp = args.includes("-h") || args.includes("--help");
  const isGlobal = args.includes("-g") || args.includes("--global");

  if (isHelp) {
    printHelp();
    return;
  }

  const hasOpenCode = args.includes("--opencode");
  const hasCursor   = args.includes("--cursor");
  const hasClaude   = args.includes("--claude");
  const hasAll      = args.includes("--all");

  const subcommandIndex = args.indexOf("skills");
  const command = subcommandIndex !== -1 ? args[subcommandIndex + 1] : args[0];

  if (command === "install") {
    if (hasAll) {
      await installAgents(["opencode", "cursor", "claude"], isGlobal);
    } else if (hasOpenCode || hasCursor || hasClaude) {
      const selected = [];
      if (hasOpenCode) selected.push("opencode");
      if (hasCursor) selected.push("cursor");
      if (hasClaude) selected.push("claude");
      await installAgents(selected, isGlobal);
    } else {
      await runWizard();
    }
  } else {
    printHelp();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[ERROR]", err.message);
  process.exit(1);
});
