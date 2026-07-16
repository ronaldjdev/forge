# Forge — Agent Guide

## Language

Siempre responder en español. Toda interacción, mensaje, explicación y salida debe ser en español.

## Repo structure

- `skills/forge/` — actual skill (scripts, templates, profiles, references)
- `src/cli.js` — installer, copies `skills/forge/` into agent harnesses
- `.opencode/skills/forge/` — symlink to `skills/forge/` (live dev)
- `templates/agents/` — per-agent templates (hooks, CLAUDE.md, .cursorrules, etc.)
- All scripts are pure ESM `.mjs`, Node >= 18 required

## Multi-Agent Architecture

Forge se despliega como skill en múltiples agentes de IA simultáneamente:

| Agente | Directorio | Hook | Path skill |
|--------|-----------|------|------------|
| **OpenCode** | `.opencode/skills/forge/` | — (vía sistema de skills) | `.opencode/skills/forge/` |
| **Claude Code** | `.claude/` | forgeSentinel (PostToolUse) | `.claude/skills/forge/` |
| **Cursor** | `.cursor/` | forgeSmith (preToolUse) | `.cursor/skills/forge/` |
| **Codex CLI** | `.agents/` + `.codex/` | forgeSentinel (PostToolUse) | `.agents/skills/forge/` |
| **Gemini** | `.gemini/` | — | `.gemini/skills/forge/` |
| **Genéricos** | `.agents/` | forgeSentinel (PostToolUse) | `.agents/skills/forge/` |

### Hooks

- **forgeSentinel** (PostToolUse): se ejecuta DESPUÉS de cada escritura. Analiza archivos modificados y reporta violaciones arquitectónicas como recordatorio. No bloquea.
- **forgeSmith** (preToolUse, solo Cursor): se ejecuta ANTES de cada escritura. Puede DENEGAR escrituras que introduzcan violaciones CRITICAL o ERROR.

## Boot sequence (mandatory before any action)

Run these 10 steps in order for every interaction. Use the agent-specific path prefix:

| Agente | Path prefix |
|--------|-------------|
| OpenCode | `.opencode/skills/forge` |
| Claude | `.claude/skills/forge` |
| Cursor | `.cursor/skills/forge` |
| Codex | `.agents/skills/forge` |
| Gemini | `.gemini/skills/forge` |

```bash
# Template — reemplazar <AGENT> por el directorio del agente correspondiente
node <AGENT>/scripts/context.mjs
node <AGENT>/scripts/armorer.mjs
node <AGENT>/scripts/profile.mjs --extended
node <AGENT>/scripts/graph.mjs --json
node <AGENT>/scripts/chain.mjs --json
node <AGENT>/scripts/inspect.mjs --json
node <AGENT>/scripts/architecture.mjs
# Execute user's command
node <AGENT>/scripts/forgeSentinel.mjs --reminder
node <AGENT>/scripts/architecture.mjs
```

## Commands

| Intent | Action |
|--------|--------|
| Init project | `forge` — runs context + bootstrap + profile + armorer + graph + chain + inscribe |
| New feature | `cast` — first verifies platform/shared/infra exist, calls bootstrap if missing |
| Full audit | `inspect` — 6 categories: structure(20), layers(20), ownership(20), platform(15), dependencies(15), graph(20) |
| Validate rules | `quench` — `scripts/detect.mjs` |
| Dependency graph | `chain` — topological sort across all 4 layers |
| Architecture graph | `graph` — node/edge graph with R1-R9 rules |
| Ownership report | `armorer` — orphans, duplicates, misplaced components |
| Generate ARCHITECTURE.md | `inscribe` — `scripts/architecture.mjs` |
| Extract to shared/ | `smelt` — pure code only, no infra/feature deps |
| Migrate legacy | `relocate` — can target platform/, shared/, infra/ or features/ |
| Refactor | `reforge` — considers all 4 layers |
| Harden DI | `temper` — constructor injection, no service locators |

## Architecture model

Four mandatory layers:
- `src/platform/` — config, database, http, server, logger, cache, security, events, scheduler, observability, di
- `src/features/<name>/` — domain/, application/use-cases/, application/mappers/, adapters/in/http/, adapters/out/persistence/
- `src/shared/` — errors/, contracts/, types/, utils/ (pure, no business logic, no infra deps)
- `src/infra/` — prisma/, mongodb/, redis/, mail/ (implementations, no business rules)

Dependency rules (violations = CRITICAL/ERROR):
- Allowed: `feature → platform`, `feature → shared`, `platform → infra`, `adapter → infra`, `feature → domain`
- Prohibited: `feature → infra` (R1), `platform → feature` (R2), `shared → feature` (R3), `shared → infra` (R4), `domain → infra` (R5), `domain → platform` (R6), `infra → feature` (R7), cross-feature direct imports (R8), cycles (R9)

## Import Rules (R10–R12)

| Rule | Descripción | Severidad |
|------|-------------|-----------|
| **R10** | No bare specifiers — imports locales deben usar `./`, `../` o `@/` como prefijo. Prohibido: `import X from "domain/..."` | ERROR |
| **R11** | Extensión `.js` obligatoria en imports — nunca `.ts` (ESM + verbatimModuleSyntax) | ERROR |
| **R12** | No importar desde archivos DI inexistentes (ej: `bootstrap.di.js`) — controllers importan desde `./di.js` (feature di.ts) | CRITICAL |
| **R12b** | `registerSingleton` prohibido con `model()` de Mongoose — usar `register({ useValue })` | CRITICAL |

## Post-Cast Checklist (obligatorio)

Cada vez que se ejecuta `cast`, verificar:
1. **Entity Discovery**: si la entidad ya existe en `platform/domain/entities/`, usar `@/domain/` en vez de crear entidad local
2. **DI Wiring**: crear `di.ts` (fuente única de registro) y importarlo en `app.ts`
3. **Tests**: crear `__tests__/Create<Name>.test.ts` siguiendo `templates/feature/test.ts.md`
4. **Import Validation**: R10 (no bare specifiers), R11 (extensión .js), R12 (no imports a archivos DI inexistentes)
5. **Controller/Routes**: nombres de método consistentes (createHandler vs add)
6. **quench**: `forge quench` para 0 violaciones

## Key files

- `SKILL.md` — orchestrator, boot sequence, command routing, execution flow
- `scripts/context.mjs` — main entrypoint, returns complete project context
- `scripts/graph.mjs` — node/edge builder, rule engine (9 rules)
- `scripts/armorer.mjs` — ownership detection
- `scripts/forgeSentinel.mjs` — PostToolUse hook adapter
- `scripts/forgeSmith.mjs` — preToolUse gate (Cursor)
- `scripts/forgeSentinel-lib.mjs` — shared hook logic
- `scripts/forgeSmith-admin.mjs` — hook management
- `scripts/bootstrap.mjs` — platform/shared/infra creation
- `templates/feature/` — 19 `.ts.md` templates for feature scaffolding
- `profiles/` — 10 tech profiles (express, fastify, nestjs × mongodb, postgres, prisma, drizzle)

## Installation

```bash
forge install                    # Wizard interactivo
forge install --all              # Todos los agentes detectados
forge install --claude           # Solo Claude Code
forge install --cursor           # Solo Cursor
forge install --codex            # Solo Codex CLI
forge install --gemini           # Solo Gemini
forge install --opencode         # Solo OpenCode
```

## Development workflow

- No tests, linter, formatter, or typechecker configured
- `pnpm install:local` — re-installs the skill locally after changes
- `.opencode/skills/forge/` is a symlink to `skills/forge/`, so edits take effect immediately
- Agent templates in `templates/agents/<agent>/` — modify and reinstall
- SKILL.md per agent is rendered from `templates/agents/SKILL.md.template` with `{{AGENT_PATH}}` replaced
- All scripts are self-contained `.mjs` modules with `if (process.argv[1]...)` CLI guards
- Imports between scripts are via ESM named exports
