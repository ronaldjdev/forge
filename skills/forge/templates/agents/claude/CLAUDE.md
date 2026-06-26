# Forge — Backend Architecture Operating System

Forge es un sistema operativo arquitectónico para backend. Diseña, construye, audita y evoluciona arquitecturas basadas en **Arquitectura Hexagonal**, **DDD pragmático** y **vertical slices**.

## Boot Sequence

Ejecutar en orden antes de cualquier acción:

1. `node .opencode/skills/forge/scripts/context.mjs` — stack + layers detection
2. `node .opencode/skills/forge/scripts/armorer.mjs` — ownership, orphans, duplicates
3. `node .opencode/skills/forge/scripts/profile.mjs --extended` — tech profile
4. `node .opencode/skills/forge/scripts/graph.mjs --json` — 4-layer graph
5. `node .opencode/skills/forge/scripts/chain.mjs --json` — dependency analysis
6. `node .opencode/skills/forge/scripts/inspect.mjs --json` — full audit
7. `node .opencode/skills/forge/scripts/architecture.mjs` — update ARCHITECTURE.md
8. Execute user command (cast, quench, relocate, etc.)
9. Run architecture.mjs again

## Architecture Model

Cuatro capas obligatorias:

| Layer | Propósito |
|-------|-----------|
| `src/platform/` | config, database, http, server, logger, cache, security, events, di |
| `src/features/<name>/` | domain/, application/use-cases/, application/mappers/, adapters/in/http/, adapters/out/persistence/ |
| `src/shared/` | errors/, contracts/, types/, utils/ (puro, sin lógica de negocio) |
| `src/infra/` | prisma/, mongodb/, redis/, mail/ (implementaciones, sin reglas de negocio) |

### Dependency Rules

**Permitido:** `feature → platform`, `feature → shared`, `platform → infra`, `adapter → infra`, `feature → domain`

**Prohibido (CRITICAL):**
- R1: `feature → infra`
- R2: `platform → feature`
- R3: `shared → feature`
- R4: `shared → infra`
- R5: `domain → infra`
- R6: `domain → platform`
- R7: `infra → feature`
- R8: cross-feature direct imports
- R9: cycles

## Naming Conventions

| Elemento | Formato |
|----------|---------|
| Directorios | `kebab-case/` |
| Archivos | `<PascalCase>.<artefacto>.ts` |
| Interfaces | `I<PascalCase>.<artefacto>.ts` |
| Use cases | `<Action>.uc.ts` |
| Clases | `PascalCase` |
| Funciones/variables | `camelCase` |
| Constantes | `UPPER_SNAKE_CASE` |
| Barrel files | `index.ts` con named exports, no `export default` |
| Imports ESM | con extensión `.js`: `import { X } from "./foo.js"` |

## Commands

| Comando | Acción |
|---------|--------|
| `forge` | Init project (context + bootstrap + profile + graph) |
| `cast` | New feature (verifica platform/shared/infra primero) |
| `inspect` | Full audit (6 categorías, 110pts → 0-100) |
| `quench` | Validate dependency rules |
| `chain` | Topological dependency sort |
| `graph` | Architecture graph con R1-R9 |
| `armorer` | Ownership report (orphans, duplicates, misplaced) |
| `smelt` | Extract code to shared/ |
| `relocate` | Migrate legacy to platform/, shared/, infra/ or features/ |
| `reforge` | Refactor considering all 4 layers |
| `temper` | Harden DI (constructor injection) |
| `inscribe` | Generate ARCHITECTURE.md |

## Architecture Principles

1. **Hexagonal basado en features** — unidad de organización = feature, no capa técnica
2. **DDD ligero** — sin sobreingeniería, pragmatismo sobre dogma
3. **Separación dominio e infraestructura** — domain/ no sabe de frameworks ni BD
4. **Feature autónomo** — todo lo del dominio vive dentro de `features/<name>/`
5. **Dependencias unidireccionales** — `adapters → application → domain → (nada)`
6. **Cero lógica en controllers** — parsean, delegan, responden
7. **Cero BD fuera de repositories** — única puerta a datos
8. **DI disciplinada** — constructor injection, sin service locators
9. **Errores tipados** — clases explícitas, no `throw Error()`
10. **Grafo arquitectónico vivo** — todo componente es un nodo, toda relación un edge validado

## Key Files

- `skills/forge/SKILL.md` — orchestrator principal
- `skills/forge/reference/principles.md` — manifiesto y 15 principios
- `skills/forge/reference/patterns.md` — naming conventions
- `skills/forge/scripts/` — context, detect, inspect, chain, profile, graph, architecture, armorer, bootstrap
- `skills/forge/profiles/` — 10 tech profiles (express, fastify, nestjs × mongodb, postgres, prisma, drizzle)
- `skills/forge/templates/` — templates para feature, platform, shared, infra
- `AGENTS.md` — guía para agentes de IA
- `ARCHITECTURE.md` — estado actual de la arquitectura
