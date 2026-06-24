# Forge — Agent Guide

## Language

Siempre responder en español. Toda interacción, mensaje, explicación y salida debe ser en español.

## Repo structure

- `skills/forge/` — actual skill (scripts, templates, profiles, references)
- `src/cli.js` — installer only, copies `skills/forge/` into `.opencode/skills/forge/`
- `.opencode/skills/forge/` — symlink to `skills/forge/` (live dev)
- `.opencode/` — OpenCode runtime (`@opencode-ai/plugin`), gitignored except the symlink
- All scripts are pure ESM `.mjs`, Node >= 18 required

## Boot sequence (mandatory before any action)

Run these 9 steps in order for every interaction:

1. `node .opencode/skills/forge/scripts/context.mjs` — stack + platform/features/shared/infra detection
2. `node .opencode/skills/forge/scripts/armorer.mjs` — ownership, orphans, duplicates, misplaced
3. `node .opencode/skills/forge/scripts/profile.mjs --extended` — tech profile
4. `node .opencode/skills/forge/scripts/graph.mjs --json` — 4-layer graph (platform, feature, shared, infra)
5. `node .opencode/skills/forge/scripts/chain.mjs --json` — multi-layer dependency analysis
6. `node .opencode/skills/forge/scripts/inspect.mjs --json` — full audit (110pts → 0-100)
7. `node .opencode/skills/forge/scripts/architecture.mjs` — generate/update ARCHITECTURE.md
8. Execute user's command (cast, quench, relocate, etc.)
9. Update ARCHITECTURE.md again

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

## Key files

- `SKILL.md` — orchestrator, boot sequence, command routing, execution flow
- `scripts/context.mjs` — main entrypoint, returns complete project context
- `scripts/graph.mjs` — node/edge builder, rule engine (9 rules)
- `scripts/armorer.mjs` — ownership detection
- `scripts/bootstrap.mjs` — platform/shared/infra creation (internal, no public command)
- `templates/feature/` — 8 `.ts.md` templates for feature scaffolding
- `profiles/` — 5 tech profiles (express-mongodb, express-prisma, express-postgres, fastify-postgres, nestjs-prisma)

## Development workflow

- No tests, linter, formatter, or typechecker configured
- `pnpm install:local` — re-installs the skill locally after changes
- `.opencode/skills/forge/` is a symlink to `skills/forge/`, so edits take effect immediately
- All scripts are self-contained `.mjs` modules with `if (process.argv[1]...)` CLI guards
- Imports between scripts are via ESM named exports (context.mjs → graph.mjs, detect.mjs, armorer.mjs)
