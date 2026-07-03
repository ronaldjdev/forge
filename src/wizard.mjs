import pc from "picocolors";
import { intro, outro, select, multiselect, text, spinner, isCancel, cancel, log, tasks } from "@clack/prompts";
import { existsSync, mkdirSync, copyFileSync, readdirSync, cpSync, writeFileSync, readFileSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { homedir } from "os";
import { detectForWizard } from "./agents.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_SRC = join(__dirname, "..", "skills", "forge");
const AGENTS_TEMPLATES = join(SKILL_SRC, "templates", "agents");
const HOME = homedir();

const SEP = pc.dim("\u2500".repeat(46));

function printCenter(text, pad = 20) {
  console.log(" ".repeat(pad) + text);
}

// --- Installer helpers ---

function detectPM(cwd) {
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "bun.lock")) || existsSync(join(cwd, "bun.lockb"))) return "bun";
  return "npm";
}

function ensureDependencies(cwd) {
  const pkgPath = join(cwd, "package.json");
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
  const pm = detectPM(cwd);
  const order = { pnpm: ["npm", "bun"], npm: ["bun", "pnpm"], bun: ["npm", "pnpm"] };
  function runPM(bin) { execSync(`${bin} install`, { cwd, stdio: "pipe" }); }
  try { runPM(pm); }
  catch {
    for (const fb of order[pm]) {
      try { runPM(fb); return; } catch { }
    }
    log.warn("No se pudieron instalar dependencias. Ejecut\u00e1 'pnpm install' manualmente.");
  }
}

function generateCommands(configDir) {
  const COMMANDS = [
    { name: "forge-forge", desc: "Forge \u2014 inicializar proyecto arquitect\u00f3nicamente" },
    { name: "forge-cast", desc: "Cast \u2014 crear un nuevo feature hexagonal" },
    { name: "forge-inspect", desc: "Inspect \u2014 auditor\u00eda arquitect\u00f3nica" },
    { name: "forge-relocate", desc: "Relocate \u2014 migrar feature legacy" },
    { name: "forge-reforge", desc: "Reforge \u2014 refactorizar arquitectura" },
    { name: "forge-quench", desc: "Quench \u2014 verificar reglas arquitect\u00f3nicas" },
    { name: "forge-temper", desc: "Temper \u2014 endurecer arquitectura" },
    { name: "forge-chain", desc: "Chain \u2014 cadena de dependencias" },
    { name: "forge-inscribe", desc: "Inscribe \u2014 generar ARCHITECTURE.md" },
    { name: "forge-smelt", desc: "Smelt \u2014 extraer c\u00f3digo a shared/" },
  ];
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

function copyAgentTemplate(name, dest) {
  const src = join(AGENTS_TEMPLATES, name);
  if (!existsSync(src)) return;
  for (const entry of readdirSync(src)) {
    const srcFile = join(src, entry);
    const destFile = join(dest, entry);
    if (existsSync(srcFile)) cpSync(srcFile, destFile, { recursive: true, force: true });
  }
}

function renderSkillPaths(skillDest, skillPath) {
  for (const entry of readdirSync(skillDest)) {
    const fullPath = join(skillDest, entry);
    if (statSync(fullPath).isDirectory()) {
      renderSkillPaths(fullPath, skillPath);
    } else if (entry.endsWith(".md")) {
      const content = readFileSync(fullPath, "utf-8");
      if (content.includes("{{AGENT_PATH}}")) {
        writeFileSync(fullPath, content.replace(/\{\{AGENT_PATH\}\}/g, skillPath), "utf-8");
      }
    }
  }
}

const AGENT_SKILL_PATHS = {
  claude: ".claude/skills/forge",
  cursor: ".cursor/skills/forge",
  codex:  ".agents/skills/forge",
  gemini: ".gemini/skills/forge",
  agents: ".agents/skills/forge",
  opencode: ".opencode/skills/forge",
};

function installAgentTemplates(agentDir, agentName) {
  const templateDir = join(AGENTS_TEMPLATES, agentName);
  if (!existsSync(templateDir)) {
    return { ok: false, error: `Template ${agentName} no encontrado` };
  }
  mkdirSync(agentDir, { recursive: true });
  // Copy skill into <agentDir>/skills/forge/
  const skillDest = join(agentDir, "skills", "forge");
  cpSync(SKILL_SRC, skillDest, { recursive: true, force: true });
  // Copy template files (hooks, CLAUDE.md, .cursorrules, etc.)
  copyAgentTemplate(agentName, agentDir);

  const skillPath = AGENT_SKILL_PATHS[agentName] || agentName;

  // Render SKILL.md with agent-specific path
  const templatePath = join(AGENTS_TEMPLATES, "SKILL.md.template");
  if (existsSync(templatePath)) {
    const template = readFileSync(templatePath, "utf-8");
    const rendered = template.replace(/\{\{AGENT_PATH\}\}/g, skillPath);
    writeFileSync(join(skillDest, "SKILL.md"), rendered, "utf-8");
  }

  // Render {{AGENT_PATH}} in remaining .md files (command/forge.md, reference/*.md)
  renderSkillPaths(skillDest, skillPath);

  // Codex special case: also copy hooks.json to .codex/
  if (agentName === "codex") {
    const codexDir = join(process.cwd(), ".codex");
    mkdirSync(codexDir, { recursive: true });
    const hooksSrc = join(templateDir, "hooks.json");
    if (existsSync(hooksSrc)) {
      cpSync(hooksSrc, join(codexDir, "hooks.json"), { force: true });
    }
  }

  return { ok: true, dest: agentDir };
}

const HOOK_LABELS = {
  claude: "forgeSentinel (PostToolUse)",
  cursor: "forgeSmith (preToolUse)",
  codex:  "forgeSentinel (PostToolUse)",
  gemini: "—",
  agents: "forgeSentinel (PostToolUse)",
};

// --- Welcome ---

async function welcomePhase() {
  console.clear();
  printCenter(pc.bold(pc.cyan("\u2694 Forge")), 22);
  console.log();
  printCenter(pc.dim("Sistema Operativo de Arquitectura"), 17);
  console.log();
  console.log("  " + SEP);
  console.log();
  console.log("  Bienvenido a Forge.");
  console.log();
  console.log("  Forge instalar\u00e1 la Skill de Arquitectura");
  console.log("  en uno o varios agentes de IA compatibles.");
  console.log();

  const result = await text({
    message: "Presiona Enter para continuar",
    placeholder: "",
    initialValue: "",
  });

  if (isCancel(result)) {
    cancel("Cancelado, no pasa nada");
    process.exit(0);
  }
}

// --- Detection ---

async function detectionPhase(cwd) {
  console.clear();
  log.message(pc.cyan("\u2694 Detectando agentes compatibles..."));

  const s = spinner();
  s.start("Buscando instalaciones...");

  const agents = detectForWizard(cwd);
  s.stop("B\u00fasqueda completada");
  console.log();

  const detectedCount = agents.filter((a) => a.detected).length;

  for (const agent of agents) {
    const label = agent.label.padEnd(20);
    const scope = agent.scope;
    if (agent.detected) {
      console.log(`  ${pc.green("\u2714")} ${label}${pc.dim(scope)}`);
    } else {
      console.log(`  ${pc.red("\u2718")} ${label}${pc.dim(scope)}`);
    }
  }

  console.log();
  log.success(`Se encontraron ${detectedCount} instalaciones compatibles.`);
  console.log();

  await text({
    message: "Presiona Enter para continuar",
    placeholder: "",
    initialValue: "",
  });

  return agents;
}

// --- Agent selection ---

async function selectionPhase(agents) {
  console.clear();
  log.message(pc.cyan("\u2694 Selecciona los agentes"));
  console.log();

  const options = agents.map((a) => ({
    value: a.id,
    label: `${a.label} (${a.scope})`,
    hint: a.detected ? "disponible" : undefined,
  }));

  options.push({ value: "__custom__", label: "Ruta personalizada" });

  const selected = await multiselect({
    message: "Espacio = seleccionar  |  Enter = continuar",
    options,
    required: false,
  });

  if (isCancel(selected)) {
    cancel("Cancelado, no pasa nada");
    process.exit(0);
  }

  let customPath = null;
  if (selected.includes("__custom__")) {
    customPath = await text({
      message: "\u00bfD\u00f3nde deseas instalar Forge?",
      placeholder: "/home/usuario/.claude",
      validate: (v) => (v ? undefined : "La ruta es requerida"),
    });

    if (isCancel(customPath)) {
      cancel("Cancelado, no pasa nada");
      process.exit(0);
    }

    if (existsSync(customPath)) {
      log.success("Ruta v\u00e1lida");
    } else {
      log.info("La ruta no existe, se crear\u00e1 al instalar");
    }
  }

  return { selectedIds: selected.filter((id) => id !== "__custom__"), customPath };
}

// --- Summary ---

async function summaryPhase(agentSelection) {
  const allAgents = detectForWizard(process.cwd());
  const selectedAgents = agentSelection.selectedIds
    .map((id) => allAgents.find((a) => a.id === id))
    .filter(Boolean);

  while (true) {
    console.clear();
    log.message(pc.cyan("\u2694 Resumen"));
    console.log("  " + SEP);
    console.log();
    console.log(`  ${pc.bold("Agentes")}`);
    console.log();

    for (const agent of selectedAgents) {
      console.log(`  \u2022 ${agent.label} ${pc.dim(`(${agent.scope})`)}`);
    }
    if (agentSelection.customPath) {
      console.log(`  \u2022 Ruta personalizada ${pc.dim(`(${agentSelection.customPath})`)}`);
    }

    console.log();
    console.log(`  ${pc.bold("Componentes")}`);
    console.log();

    const hasHooks = agentSelection.selectedIds.some(id =>
      ["claude-project", "claude-global", "cursor-project", "codex-project", "codex-global", "agents-project"].includes(id)
    );

    const components = [
      "Forge Skill",
      "Reglas",
      "Prompts",
      "Comandos",
      "Plantillas",
      "Agentes",
      hasHooks ? "forgeSentinel (PostToolUse) / forgeSmith (preToolUse)" : null,
    ].filter(Boolean);
    for (const comp of components) {
      console.log(`  ${pc.green("\u2714")} ${comp}`);
    }

    console.log();
    console.log("  " + SEP);
    console.log();

    const action = await select({
      message: "\u00bfDeseas continuar?",
      options: [
        { value: "install", label: "Instalar" },
        { value: "back", label: "Volver" },
        { value: "cancel", label: "Cancelar" },
      ],
    });

    if (isCancel(action) || action === "cancel") {
      cancel("Cancelado, no pasa nada");
      process.exit(0);
    }

    if (action === "back") {
      return "back";
    }

    return { action: "install", selectedAgents, customPath: agentSelection.customPath };
  }
}

// --- Installation ---

const AGENT_MAP = {
  "claude-global":    { name: "claude", dir: () => join(HOME, ".claude"), verify: "CLAUDE.md" },
  "claude-project":   { name: "claude", dir: () => join(process.cwd(), ".claude"), verify: "CLAUDE.md" },
  "cursor-project":   { name: "cursor", dir: () => join(process.cwd(), ".cursor"), verify: ".cursorrules" },
  "codex-project":    { name: "codex",  dir: () => join(process.cwd(), ".agents"),  verify: "hooks.json" },
  "codex-global":     { name: "codex",  dir: () => join(HOME, ".codex"),            verify: "hooks.json" },
  "gemini-project":   { name: "gemini", dir: () => join(process.cwd(), ".gemini"), verify: "SKILL.md" },
  "agents-project":   { name: "agents", dir: () => join(process.cwd(), ".agents"), verify: "hooks.json" },
  "opencode-global":  null,
  "opencode-project": null,
  "copilot-project":  null,
};

function buildAgentSteps(agent, cwd) {
  const label = `${agent.label} (${agent.scope})`;
  const s = (title, fn) => ({ title: `${pc.dim("\u2502")} ${title}`, task: fn });

  // Handle special cases (opencode, copilot) separately
  if (agent.id === "opencode-global") {
    const dest = join(HOME, ".config", "opencode", "skills", "forge");
    const configDir = join(HOME, ".config", "opencode");
    const skillPath = join(".config", "opencode", "skills", "forge");
    const steps = [];
    steps.push(s("Copiando Skill en opencode/", async () => {
      mkdirSync(dest, { recursive: true });
      cpSync(SKILL_SRC, dest, { recursive: true, force: true });
      renderSkillPaths(dest, skillPath);
      return "Skill copiada";
    }));
    steps.push(s("Registrando comandos + dependencias", async () => {
      generateCommands(configDir);
      ensureDependencies(configDir);
      return "Comandos y dependencias listos";
    }));
    steps.push(s("Verificando instalaci\u00f3n", async () => {
      const ok = existsSync(join(dest, "scripts", "context.mjs"));
      return ok ? "\u2714 Instalaci\u00f3n verificada" : "ERROR: Skill no encontrada";
    }));
    return { label, dest, steps };
  }

  if (agent.id === "opencode-project") {
    const dest = join(cwd, ".opencode", "skills", "forge");
    const configDir = join(cwd, ".opencode");
    const skillPath = join(".opencode", "skills", "forge");
    const steps = [];
    steps.push(s("Copiando Skill en .opencode/", async () => {
      mkdirSync(dest, { recursive: true });
      cpSync(SKILL_SRC, dest, { recursive: true, force: true });
      renderSkillPaths(dest, skillPath);
      return "Skill copiada";
    }));
    steps.push(s("Registrando comandos + dependencias", async () => {
      generateCommands(configDir);
      ensureDependencies(configDir);
      return "Comandos y dependencias listos";
    }));
    steps.push(s("Verificando instalaci\u00f3n", async () => {
      const ok = existsSync(join(dest, "scripts", "context.mjs"));
      return ok ? "\u2714 Instalaci\u00f3n verificada" : "ERROR: Skill no encontrada";
    }));
    return { label, dest, steps };
  }

  if (agent.id === "copilot-project") {
    const ghDir = join(cwd, ".github");
    const dest = join(ghDir, "copilot-instructions.md");
    const steps = [];
    steps.push(s("Instalando reglas en .github/", async () => {
      mkdirSync(ghDir, { recursive: true });
      const src = join(AGENTS_TEMPLATES, "cursor", ".cursorrules");
      if (existsSync(src)) copyFileSync(src, dest);
      const ok = existsSync(dest);
      return ok ? "Reglas instaladas" : "ERROR";
    }));
    return { label, dest, steps };
  }

  // Generic agent types via AGENT_MAP
  const map = AGENT_MAP[agent.id];
  if (!map) return null;

  const dest = map.dir();
  const agentName = map.name;
  const steps = [];
  steps.push(s(`Instalando Forge + hooks en ${dest}/`, async () => {
    const r = installAgentTemplates(dest, agentName);
    return r.ok ? `Forge + ${HOOK_LABELS[agentName] || "templates"} instalados` : `ERROR: ${r.error}`;
  }));
  steps.push(s("Verificando instalaci\u00f3n", async () => {
    const ok = existsSync(join(dest, "skills", "forge", "scripts", "context.mjs")) &&
               existsSync(join(dest, map.verify));
    return ok ? "\u2714 Instalaci\u00f3n verificada" : "ERROR: archivos no encontrados";
  }));
  return { label, dest, steps };
}

async function installPhase(result, cwd) {
  console.clear();
  log.message(pc.cyan("\u2694 Instalando Forge..."));

  const agentsData = [];
  for (const agent of result.selectedAgents) {
    const data = buildAgentSteps(agent, cwd);
    if (data) agentsData.push(data);
  }

  if (result.customPath) {
    const dest = result.customPath;
    const steps = [];
    const s = (title, fn) => ({ title: `${pc.dim("\u2502")} ${title}`, task: fn });
    steps.push(s("Instalando Forge en ruta personalizada", async () => {
      mkdirSync(dest, { recursive: true });
      cpSync(SKILL_SRC, join(dest, "forge"), { recursive: true, force: true });
      copyAgentTemplate("claude", dest);
      return "Forge instalado";
    }));
    steps.push(s("Verificando instalaci\u00f3n", async () => {
      return existsSync(join(dest, "forge")) ? "\u2714 Instalaci\u00f3n verificada" : "ERROR";
    }));
    agentsData.push({ label: `Ruta personalizada (${dest})`, dest, steps });
  }

  const allSteps = [];
  for (const ad of agentsData) {
    allSteps.push({
      title: pc.bold(pc.cyan(ad.label)),
      task: async () => `Instalando en ${ad.dest}`,
    });
    for (const step of ad.steps) {
      allSteps.push(step);
    }
  }

  await tasks(allSteps);
}

// --- Main wizard orchestrator ---

export async function runWizard() {
  const cwd = process.cwd();

  await welcomePhase();

  console.clear();
  intro(pc.cyan("\u2694 Forge"));

  const agents = await detectionPhase(cwd);

  let agentSelection;
  let result;

  while (true) {
    agentSelection = await selectionPhase(agents);

    if (agentSelection.selectedIds.length === 0 && !agentSelection.customPath) {
      log.warn("Seleccion\u00e1 al menos un agente o una ruta personalizada.");
      continue;
    }

    result = await summaryPhase(agentSelection);

    if (result === "back") continue;
    break;
  }

  await installPhase(result, cwd);

  console.log();
  console.log("  " + SEP);
  printCenter(pc.bold(pc.cyan("\u2694 Forge")), 22);
  console.log();
  printCenter(pc.green("Instalaci\u00f3n completada correctamente."), 12);
  console.log();
  console.log(`  Forge se instal\u00f3 en:`);
  console.log();

  for (const agent of result.selectedAgents) {
    console.log(`  ${pc.green("\u2714")} ${agent.label} ${pc.dim(`(${agent.scope})`)}`);
  }
  if (result.customPath) {
    console.log(`  ${pc.green("\u2714")} Ruta personalizada ${pc.dim(`(${result.customPath})`)}`);
  }

  console.log();
  console.log(`  ${pc.bold("Pr\u00f3ximos pasos")}`);
  console.log();
  console.log(`  \u2022 Reinicia tu agente si est\u00e1 abierto.`);
  console.log(`  \u2022 Ejecut\u00e1 el comando "forge" dentro del agente.`);
  console.log(`  \u2022 forgeSentinel se activa autom\u00e1ticamente tras cada escritura.`);
  console.log(`  \u2022 forgeSmith (Cursor) previene escrituras con violaciones CRITICAL.`);
  console.log(`  \u2022 Gesti\u00f3n de hooks: node .<agent>/skills/forge/scripts/forgeSmith-admin.mjs`);
  console.log();
  console.log("  " + SEP);
  console.log();

  outro(pc.cyan("\u00a1Forge est\u00e1 listo para usar! \u2694"));
}
