# Develop

Guía para desarrollar y contribuir a Forge.

## Stack

- Node.js ≥ 18
- ESM puro (`.mjs`)
- Sin dependencias runtime
- Tests con `node:test` (sin dependencias externas)
- Output formateado con `formatter.mjs` (JSON, colores, scoreBar)
- Sin linter ni typechecker configurados

## Repo structure

```
forge/
├── src/
│   └── cli.js              ← Installer (copia skill/ al directorio destino)
├── skills/
│   └── forge/              ← Skill runtime (todo el código)
│       ├── SKILL.md        ← Orquestador: boot sequence, command routing
│       ├── scripts/        ← Módulos ESM ejecutables
│       │   ├── context.mjs
│       │   ├── armorer.mjs
│       │   ├── profile.mjs
│       │   ├── graph.mjs
│       │   ├── chain.mjs
│       │   ├── detect.mjs
│       │   ├── inspect.mjs
│       │   ├── architecture.mjs
│       │   ├── bootstrap.mjs
│       │   ├── formatter.mjs
│       │   ├── assay.mjs
│       │   ├── posttool.mjs
│       │   ├── forge-config.mjs
│       │   ├── forge-state.mjs
│       │   ├── forge-signals.mjs
│       │   ├── forge-api.mjs
│       │   ├── hook.mjs
│       │   ├── pin.mjs
│       │   ├── rollback.mjs
│       │   ├── rename.mjs
│       │   ├── parse-imports.mjs
│       │   ├── update.mjs
│       │   ├── forge-bench.mjs
│       │   └── registry/
│       │       └── rules.mjs
│       ├── templates/      ← Scaffolding: feature/, platform/, shared/, infra/
│       ├── profiles/       ← 10 tech profiles
│       └── reference/      ← Docs, patterns.md
├── .opencode/
│   └── skills/forge/ → ../../skills/forge  ← Symlink para live dev
├── AGENTS.md               ← Guía para OpenCode
├── README.md
├── DEVELOP.md
└── .forge/                 ← Estado persistente (gitignored)
    ├── config.json
    ├── state.json
    ├── history.json
    ├── rules.json          ← Custom rules opcionales
    └── assay/              ← Ensayos multi-persona
```

## Setup

```bash
git clone <repo>
cd forge
npm install
```

No se necesita compilación ni build. Los cambios en `skills/forge/` se reflejan al instante vía symlink.

## Live development

`.opencode/skills/forge/` es un symlink a `skills/forge/`. Cualquier edit en `skills/forge/` se refleja inmediatamente.

Si necesitas reinstalar la skill localmente:

```bash
pnpm install:local
```

## ESM conventions

- Todos los scripts en `scripts/` son `.mjs`
- Cada script es ejecutable standalone + importable:

```js
if (process.argv[1] && process.argv[1].endsWith("script.mjs")) {
  main()
}
export function main() { ... }
```

- Los imports cruzados usan named exports:

```js
import { buildGraph } from './graph.mjs'
```

## Adding a new command

1. Crear script en `scripts/<comando>.mjs`
2. Registrar ruta en `SKILL.md` (command routing table + module index)
3. Agregar entrada en boot sequence si aplica
4. Agregar template de respuesta en `reference/<comando>.md` si aplica
5. Documentar en `README.md` (comandos + módulos + perfiles si aplica)
6. Agregar tests en `tests/core.test.mjs`

## Adding a new template

Agregar archivo `.ts.md` en el directorio correspondiente de `templates/`:

- `templates/feature/` — 20 templates (entity, repository interface, schema, repository impl, use case, controller, routes, mapper, domain-error, domain-event, event-handler, service-provider)
- `templates/platform/` — 6 templates (config, logger, http, server, database, di)
- `templates/shared/` — 4 templates (errors, contracts, types, utils)
- `templates/infra/` — 4 templates (prisma, mongodb, redis, mail)

Cada template es TypeScript con placeholders `${placeholder}` interpolados por el script que lo usa.

## Adding a tech profile

Crear archivo en `profiles/<name>.jsonc` con:

- Dependencies del framework, ORM, BD
- Estructura base de directorios
- Setup de DI (tsyringe / manual / NestJS)
- Routing conventions
- Testing conventions
- Naming conventions

## Boot sequence

Al ejecutar cualquier comando, la skill corre 8 pasos en orden. Esta secuencia garantiza contexto completo:

1. `context.mjs` — stack + detección platform/features/shared/infra
2. `armorer.mjs` — ownership, orphans, duplicates, misplaced
3. `profile.mjs --extended` — tech profile
4. `graph.mjs --json` — 4-layer graph
5. `chain.mjs --json` — multi-layer dependency analysis
6. `inspect.mjs --json` — full audit (110pts → 0-100)
7. `architecture.mjs` — generate/update ARCHITECTURE.md
8. Ejecutar comando del usuario (cast, quench, assay, etc.)
9. `architecture.mjs` — actualizar ARCHITECTURE.md con el nuevo estado

### Inline Ignores

Forge soporta comentarios inline para excepcionar reglas:

```ts
// forge-ignore-next-line     → ignora la línea siguiente
// forge-ignore: R1           → ignora solo la regla R1
// forge-ignore: R1, R8       → ignora R1 y R8
```

Ver `SKILL.md` sección "Inline Ignores" para detalle completo.

### Tests

Ubicación: `tests/core.test.mjs` (31 tests, 10 suites)

```bash
node --test .opencode/skills/forge/tests/core.test.mjs
```

| Suite | Tests |
|-------|-------|
| `profile.mjs` | 8 |
| `graph.mjs` | 1 |
| `armorer.mjs` | 1 |
| `forge-config.mjs` | 2 |
| `chain.mjs` | 1 |
| `formatter.mjs` | 4 |
| `registry/rules.mjs` | 4 |
| `detect.mjs` (inline ignores) | 5 |
| `posttool.mjs` | 1 |
| `assay.mjs` | 4 |

### Flags CLI

| Flag | Comando | Descripción |
|------|---------|-------------|
| `--fix` | `quench` | Auto-corrige missing @injectable(), tsconfig, naming, container.resolve |
| `--show-ignores` | `quench` | Muestra inline ignores encontrados |
| `--persona=<id>` | `assay` | Filtra por persona (bezos, fowler, hacker, pm, senior) |
| `--save` | `assay` | Persiste ensayo en `.forge/assay/` |
| `--json` | assay, forge state | Salida JSON |
| `--list` | `nail` | Lista atajos registrados |

## Conventions

- Directorios: `kebab-case/`
- Archivos: `<PascalCase>.<artefacto>.ts`
- Interfaces: `I<PascalCase>.<artefacto>.ts`
- Use cases: `<Action>.uc.ts`
- Mensajes de commit en inglés, presente imperativo
- Ver `reference/patterns.md` para naming detallado

## Versioning

- `package.json` en raíz del repo (no el de skills/)
- `npm version <major|minor|patch>` para bump
- Tags semver (`v1.1.0`)
- Changelog manual en releases de GitHub

## Current

- **Version**: 1.7.0
- **Total modules**: 24 scripts, 26 templates, 10 profiles, 24 references
- **Tests**: 31 (10 suites, 100% passing)
