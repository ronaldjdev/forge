#!/usr/bin/env node

import { copyFileSync, mkdirSync, existsSync, writeFileSync, readFileSync, cpSync, readdirSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { spinner, log } from "@clack/prompts";
import { runWizard } from "./wizard.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_SRC = join(__dirname, "..", "skills", "forge");
const AGENTS_TEMPLATES = join(SKILL_SRC, "templates", "agents");

const AGENT_CONFIGS = {
  claude:  { dir: ".claude",  template: "claude",  skillPath: ".claude/skills/forge",  need: ["CLAUDE.md", "settings.local.json"], postInstall: "forgeSentinel" },
  cursor:  { dir: ".cursor",  template: "cursor",  skillPath: ".cursor/skills/forge",  need: [".cursorrules", "hooks.json"],         postInstall: "forgeSmith" },
  codex:   { dir: ".agents",  template: "codex",   skillPath: ".agents/skills/forge",  need: ["hooks.json"],                          postInstall: "forgeSentinel" },
  gemini:  { dir: ".gemini",  template: "gemini",  skillPath: ".gemini/skills/forge",  need: ["SKILL.md"],                            postInstall: null },
  agents:  { dir: ".agents",  template: "agents",  skillPath: ".agents/skills/forge",  need: ["hooks.json"],                          postInstall: "forgeSentinel" },
};

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
  { name: "forge-forge", desc: "Forge — inicializar proyecto arquitectónicamente", flags: "" },
  { name: "forge-cast", desc: "Cast — crear un nuevo feature hexagonal desde cero", flags: "" },
  { name: "forge-inspect", desc: "Inspect — inspeccionar la conformidad arquitectónica", flags: "--json | --diff | --full | --summary | --severity=<nivel> | --force" },
  { name: "forge-assay", desc: "Assay — ensayo arquitectónico multi-persona", flags: "--persona=<id> | --json | --save | history" },
  { name: "forge-graph", desc: "Graph — construir el grafo arquitectónico del proyecto", flags: "--json" },
  { name: "forge-armorer", desc: "Armorer — reporte de ownership, huérfanos y duplicados", flags: "" },
  { name: "forge-bootstrap", desc: "Bootstrap — inicializar platform, shared e infra layers", flags: "" },
  { name: "forge-relocate", desc: "Relocate — migrar feature legacy a la nueva estructura", flags: "" },
  { name: "forge-reforge", desc: "Reforge — refactorizar la arquitectura de un feature", flags: "--cycles" },
  { name: "forge-quench", desc: "Quench — verificar reglas arquitectónicas del proyecto", flags: "--fix | --show-ignores | --severity=<nivel> | --json" },
  { name: "forge-temper", desc: "Temper — endurecer la arquitectura (DI, seguridad)", flags: "" },
  { name: "forge-chain", desc: "Chain — analizar cadena de dependencias entre features", flags: "--json" },
  { name: "forge-inscribe", desc: "Inscribe — generar y mantener ARCHITECTURE.md", flags: "--output=<path>" },
  { name: "forge-smelt", desc: "Smelt — extraer código reutilizable a shared/", flags: "" },
];

function generateCommands(configDir) {
  const cmdsDir = join(configDir, "commands");
  mkdirSync(cmdsDir, { recursive: true });
  for (const cmd of COMMANDS) {
    const sub = cmd.name.replace("forge-", "");
    const hasFlags = cmd.flags && cmd.flags.length > 0;
    const lines = [
      "---",
      `description: ${cmd.desc}`,
      "agent: build",
      "---",
      "",
      `Ejecuta el subcomando ${sub} de Forge con los argumentos: $ARGUMENTS`,
      "",
    ];
    if (hasFlags) {
      lines.push(
        `Flags disponibles: ${cmd.flags}`,
        "",
        `Si $ARGUMENTS está vacío, pregunta al usuario qué flags quiere usar con la tool question (checkboxes múltiples). Si no selecciona ninguna, ejecuta sin flags.`,
        "",
      );
    }
    writeFileSync(join(cmdsDir, `${cmd.name}.md`), lines.join("\n"));
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

async function installAgentTemplates(agentDir, agentName) {
  const config = AGENT_CONFIGS[agentName];
  if (!config) return;

  const templateDir = join(AGENTS_TEMPLATES, config.template);
  if (!existsSync(templateDir)) {
    log.error(`Template para ${agentName} no encontrado en ${templateDir}`);
    return;
  }

  const s = spinner();
  s.start(`Copiando templates para ${agentName} en ${agentDir}/`);

  mkdirSync(agentDir, { recursive: true });

  // Copy skill into <agentDir>/skills/forge/
  const skillDest = join(agentDir, "skills", "forge");
  cpSync(SKILL_SRC, skillDest, { recursive: true, force: true });

  // Copy template files (hooks, CLAUDE.md, .cursorrules, etc.)
  for (const entry of readdirSync(templateDir)) {
    const srcFile = join(templateDir, entry);
    const destFile = join(agentDir, entry);
    cpSync(srcFile, destFile, { recursive: true, force: true });
  }

  // Render SKILL.md with agent-specific path
  const templatePath = join(AGENTS_TEMPLATES, "SKILL.md.template");
  if (existsSync(templatePath)) {
    const template = readFileSync(templatePath, "utf-8");
    const rendered = template.replace(/\{\{AGENT_PATH\}\}/g, config.skillPath);
    writeFileSync(join(skillDest, "SKILL.md"), rendered, "utf-8");
  }

  s.stop(`${agentName} configurado en ${agentDir}/`);
  log.success(`${agentName} listo (skill + ${config.postInstall || "templates"})`);
}

async function installCursor() {
  await installAgentTemplates(join(process.cwd(), ".cursor"), "cursor");
}

async function installClaude() {
  await installAgentTemplates(join(process.cwd(), ".claude"), "claude");
}

async function installCodex() {
  // Codex hooks point to .agents/skills/forge/ via git root
  await installAgentTemplates(join(process.cwd(), ".agents"), "codex");
  // Also copy hooks.json into .codex/ so Codex CLI picks it up
  const codexDir = join(process.cwd(), ".codex");
  mkdirSync(codexDir, { recursive: true });
  const hooksSrc = join(AGENTS_TEMPLATES, "codex", "hooks.json");
  if (existsSync(hooksSrc)) {
    cpSync(hooksSrc, join(codexDir, "hooks.json"), { force: true });
  }
}

async function installGemini() {
  await installAgentTemplates(join(process.cwd(), ".gemini"), "gemini");
}

async function installAgentsGeneric() {
  await installAgentTemplates(join(process.cwd(), ".agents"), "agents");
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
      case "codex":
        await installCodex();
        break;
      case "gemini":
        await installGemini();
        break;
      case "agents":
        await installAgentsGeneric();
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
  forge install --codex            Instalar solo para Codex CLI
  forge install --gemini           Instalar solo para Gemini Code Assist
  forge install --all              Instalar para todos los agentes detectados
  forge install --global           Instalar OpenCode globalmente (~/.config/opencode/)
  forge install --help             Mostrar esta ayuda

AGENTES SOPORTADOS
  OpenCode, Claude Code, Cursor, Codex CLI, Gemini Code Assist, Agentes Genéricos

HOOKS
  forgeSentinel (PostToolUse) — guardia arquitectónico post-escritura
  forgeSmith    (preToolUse)  — guardia arquitectónico pre-escritura (Cursor)

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
  const hasCodex    = args.includes("--codex");
  const hasGemini   = args.includes("--gemini");
  const hasAll      = args.includes("--all");

  const subcommandIndex = args.indexOf("skills");
  const command = subcommandIndex !== -1 ? args[subcommandIndex + 1] : args[0];

  if (command === "install") {
    if (hasAll) {
      await installAgents(["opencode", "cursor", "claude", "codex", "gemini", "agents"], isGlobal);
    } else if (hasOpenCode || hasCursor || hasClaude || hasCodex || hasGemini) {
      const selected = [];
      if (hasOpenCode) selected.push("opencode");
      if (hasCursor) selected.push("cursor");
      if (hasClaude) selected.push("claude");
      if (hasCodex) selected.push("codex");
      if (hasGemini) selected.push("gemini");
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
