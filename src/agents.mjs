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
    id: "copilot-project",
    label: "GitHub Copilot",
    scope: "Proyecto",
    detected: existsSync(join(cwd, ".github", "copilot-instructions.md")),
  });

  agents.push({
    id: "codex",
    label: "Codex CLI",
    scope: "Global",
    detected: existsSync(join(HOME, ".codex")),
  });

  return agents;
}

export { detect as detectForWizard };
