# 06 — Sistema Multi-Agente

Forge se despliega como **skill** en múltiples agentes de IA simultáneamente. Un solo proyecto puede tener Forge instalado en OpenCode, Claude Code, Cursor, Codex CLI y Gemini al mismo tiempo.

## Agentes soportados

| Agente | Path de instalación | Hook principal |
|--------|-------------------|----------------|
| **OpenCode** | `.opencode/skills/forge/` | — (vía sistema de skills) |
| **Claude Code** | `.claude/skills/forge/` | forgeSentinel (PostToolUse) |
| **Cursor** | `.cursor/skills/forge/` | forgeSmith (preToolUse) |
| **Codex CLI** | `.agents/skills/forge/` | forgeSentinel (PostToolUse) |
| **Gemini** | `.gemini/skills/forge/` | — |
| **Genéricos** | `.agents/skills/forge/` | forgeSentinel (PostToolUse) |

## Flujo de instalación

```
forge install [--all|--opencode|--claude|--cursor|--codex|--gemini]
    │
    ├── 1. Detectar agentes instalados (src/agents.mjs)
    │      Busca directorios: .claude/, .opencode/, .cursor/, .codex/, .gemini/
    │
    ├── 2. Copiar skills/forge/ → directorio del agente
    │      Ejemplo: skills/forge/ → .opencode/skills/forge/
    │
    ├── 3. Renderizar placeholders en .md
    │      {{AGENT_PATH}} → .opencode/skills/forge (ejemplo OpenCode)
    │
    ├── 4. Generar comandos
    │      14 comandos .md en .opencode/commands/ (ejemplo)
    │
    └── 5. Instalar dependencias del agente
           @opencode-ai/plugin (para OpenCode)
```

## El placeholder `{{AGENT_PATH}}`

Cada agente tiene un path diferente para su skill. El `SKILL.md.template` usa `{{AGENT_PATH}}` como placeholder:

```markdown
## Boot Sequence

Ejecutar `{{AGENT_PATH}}/scripts/forge-boot.mjs --depth standard --json`
```

Al instalar para OpenCode, se renderiza como:
```markdown
Ejecutar `.opencode/skills/forge/scripts/forge-boot.mjs --depth standard --json`
```

Al instalar para Claude:
```markdown
Ejecutar `.claude/skills/forge/scripts/forge-boot.mjs --depth standard --json`
```

## Hooks

### forgeSentinel (PostToolUse)

Se ejecuta **después** de cada escritura de archivos. Analiza los archivos modificados y reporta violaciones arquitectónicas como recordatorio. **No bloquea**.

```
Agente escribe archivo → forgeSentinel analiza → muestra recordatorio si hay violaciones
```

Uso en Claude Code (`settings.local.json`):
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/skills/forge/scripts/forgeSentinel.mjs --reminder"
          }
        ]
      }
    ]
  }
}
```

### forgeSmith (preToolUse — solo Cursor)

Se ejecuta **antes** de cada escritura. Puede **denegar** escrituras que introduzcan violaciones CRITICAL o ERROR.

```
Agente intenta escribir → forgeSmith analiza → DENEGA si hay CRITICAL/ERROR
```

Uso en Cursor (`hooks.json`):
```json
{
  "hooks": {
    "preToolUse": [
      {
        "matcher": "write_to_file|insert_edit",
        "command": "node .cursor/skills/forge/scripts/forgeSmith.mjs"
      }
    ]
  }
}
```

## Wizard interactivo

Cuando se ejecuta `forge` sin flags, se abre un wizard interactivo:

```
┌─────────────────────────────────┐
│  🔨 Forge — Architecture OS     │
│                                 │
│  Bienvenido al instalador de    │
│  Forge para agentes de IA.      │
│                                 │
│  1. Detectar agentes            │
│  2. Seleccionar agentes         │
│  3. Instalar skills             │
│  4. Resumen                     │
└─────────────────────────────────┘
```

El wizard usa `@clack/prompts` para una experiencia terminal moderna (spinners, select, multiselect).

## Desarrollo local

`.opencode/skills/forge/` es un **symlink** a `skills/forge/`:

```bash
ls -la .opencode/skills/forge/
# lrwxrwxrwx 1 user user 23 Jul 26 10:00 forge -> ../../skills/forge
```

Cualquier cambio en `skills/forge/` se refleja al instante en OpenCode. No necesita reinstalación.
