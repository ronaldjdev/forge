# Develop

Guía para desarrollar y contribuir a Forge.

## Stack

- Node.js ≥ 18
- ESM puro (`.mjs`)
- Sin dependencias runtime
- Sin tests, linter, formatter ni typechecker

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
│       │   └── bootstrap.mjs
│       ├── templates/      ← Scaffolding: feature/, platform/, shared/, infra/
│       ├── profiles/       ← 5 tech profiles
│       └── reference/      ← Docs, patterns.md
├── .opencode/
│   └── skills/forge/ → ../../skills/forge  ← Symlink para live dev
├── AGENTS.md               ← Guía para OpenCode
├── README.md
└── DEVELOP.md
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
if (process.argv[1] === import.meta.url) {
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
2. Registrar ruta en `SKILL.md` (command routing table)
3. Agregar entrada en boot sequence si aplica
4. Agregar template de respuesta en `reference/` si aplica
5. Documentar en `README.md`

## Adding a new template

Agregar archivo `.ts.md` en el directorio correspondiente de `templates/`:

- `templates/feature/` — 8 templates (entity, repository interface, schema, repository impl, use case, controller, routes, mapper)
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

Al ejecutar cualquier comando, la skill corre 9 pasos en orden. Esta secuencia garantiza contexto completo:

1. `context.mjs` — stack + detección platform/features/shared/infra
2. `armorer.mjs` — ownership, orphans, duplicates, misplaced
3. `profile.mjs --extended` — tech profile
4. `graph.mjs --json` — 4-layer graph
5. `chain.mjs --json` — multi-layer dependency analysis
6. `inspect.mjs --json` — full audit
7. `architecture.mjs` — generate/update ARCHITECTURE.md
8. Execute user's command
9. Update ARCHITECTURE.md again

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
- Tags semver (`v1.0.1`)
- Changelog manual en releases de GitHub
