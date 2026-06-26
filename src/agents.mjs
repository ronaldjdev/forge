import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const HOME = homedir();

function detect(cwd) {
  const agents = [];

  agents.push({
    id: "claude-global",
    label: "Claude Code",
    scope: "Global",
    detected: existsSync(join(HOME, ".claude")) || existsSync(join(HOME, ".config", "claude")),
  });

  agents.push({
    id: "claude-project",
    label: "Claude Code",
    scope: "Proyecto",
    detected: existsSync(join(cwd, ".claude")) || existsSync(join(cwd, "CLAUDE.md")),
  });

  agents.push({
    id: "opencode-global",
    label: "OpenCode",
    scope: "Global",
    detected: existsSync(join(HOME, ".config", "opencode")),
  });

  agents.push({
    id: "opencode-project",
    label: "OpenCode",
    scope: "Proyecto",
    detected: existsSync(join(cwd, ".opencode")),
  });

  agents.push({
    id: "cursor-project",
    label: "Cursor",
    scope: "Proyecto",
    detected: existsSync(join(cwd, ".cursor")) || existsSync(join(cwd, ".cursorrules")),
  });

  agents.push({
    id: "codex-project",
    label: "Codex CLI",
    scope: "Proyecto",
    detected: existsSync(join(cwd, ".codex")),
  });

  agents.push({
    id: "gemini-project",
    label: "Gemini Code Assist",
    scope: "Proyecto",
    detected: existsSync(join(cwd, ".gemini")),
  });

  agents.push({
    id: "agents-project",
    label: "Agentes Genéricos",
    scope: "Proyecto",
    detected: existsSync(join(cwd, ".agents")),
  });

  agents.push({
    id: "copilot-project",
    label: "GitHub Copilot",
    scope: "Proyecto",
    detected: existsSync(join(cwd, ".github", "copilot-instructions.md")),
  });

  agents.push({
    id: "codex-global",
    label: "Codex CLI",
    scope: "Global",
    detected: existsSync(join(HOME, ".codex")),
  });

  return agents;
}

function detectAll(cwd) {
  const all = detect(cwd);
  return all.filter(a => a.detected).map(a => a.id);
}

export { detect as detectForWizard, detectAll };
