# CHANGELOG

## v1.2.0 — Interactive Installer & Multi-Agent (2026-06-26)

### Added
- **Wizard interactivo de instalación** con @clack/prompts (7 fases: bienvenida, detección, selección, resumen, instalación)
- **Soporte multi-agente (beta)**: OpenCode, Cursor, Claude Code, GitHub Copilot, Codex CLI
- **Instalación directa** con flags: `--opencode`, `--cursor`, `--claude`, `--all`, `--global`
- **Detección automática** de agentes compatibles en el sistema
- **Archivos compatibility**: `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`

### Changed
- Optimización de velocidad de instalación: `fs.cpSync` nativo, eliminación de delays artificiales
- Pasos de instalación consolidados (de 5–7 a 2–3 por agente)
- Flujo del wizard simplificado: eliminadas fases de scope y versión (código muerto)
- Limpieza de imports no utilizados

### Removed
- Soporte de symlink (obsoleto)

---

## v1.1.0 — AOS Evolution (2026-06-25)

### Nuevos módulos (11 scripts)

- **`scripts/formatter.mjs`** — Output unificado con colores, JSON, scoreBar, formatCheck, formatViolation
- **`scripts/registry/rules.mjs`** — Anti-pattern registry desacoplado con R1-R9 + custom rules desde `.forge/rules.json`
- **`scripts/assay.mjs`** — Ensayo arquitectónico multi-persona (Bezos, Fowler, Hacker, PM, Arquitecta Senior)
- **`scripts/posttool.mjs`** — PostToolUse hook con `--reminder` (no bloqueante) y `--strict` (exit code 1)
- **`scripts/forge-config.mjs`** — Persistencia de config, estado e histórico de auditorías
- **`scripts/forge-state.mjs`** — CLI wrapper de estado post-auditoría
- **`scripts/forge-signals.mjs`** — Manejo de señales (SIGINT, SIGTERM)
- **`scripts/forge-api.mjs`** — Validación de contratos API
- **`scripts/hook.mjs`** — Gestión de git pre-commit hook
- **`scripts/pin.mjs`** — Shortcuts de navegación (nail/unnail)
- **`scripts/parse-imports.mjs`** — Parsing de imports ESM
- **`scripts/rename.mjs`** — Renombrado bulk con actualización de imports
- **`scripts/rollback.mjs`** — Backup & restore para relocate/reforge
- **`scripts/update.mjs`** — Verificador de actualizaciones

### Nuevas capacidades

- **Inline ignores**: `// forge-ignore-next-line` y `// forge-ignore: R1, R8` para excepcionar reglas línea por línea
- **`--fix` automático**: Auto-corrige missing `@injectable()`, tsconfig, naming violations, `container.resolve()`, `reflect-metadata`
- **`--show-ignores`**: Lista todos los inline ignores encontrados en el código
- **Multi-persona review**: 5 perspectivas arquitectónicas en un solo comando
- **PostToolUse hook**: Análisis automático post-escritura de archivos

### Perfiles tecnológicos (5 → 10)

- `express-drizzle`: Express + PostgreSQL + Drizzle ORM + tsyringe
- `fastify-mongodb`: Fastify + MongoDB + Mongoose + Manual DI
- `fastify-prisma`: Fastify + PostgreSQL + Prisma + Manual DI
- `nestjs-mongodb`: NestJS + MongoDB + Mongoose + NestJS DI
- `nestjs-postgres`: NestJS + PostgreSQL + Prisma + NestJS DI

### Templates (8 → 11 feature templates)

- Nuevos: `domain-error.ts.md`, `domain-event.ts.md`, `event-handler.ts.md`
- use-case template ahora incluye eventos de dominio, errores de dominio y event bus opcionales

### Documentación (15 → 22 references)

- Nuevas: `api-design.md`, `assay.md`, `data-patterns.md`, `di-strategies.md`, `errors.md`, `events.md`, `help.md`, `hooks.md`, `observability.md`, `security-patterns.md`, `testing-patterns.md`
- `SKILL.md` reescrito: streamlined, 19 comandos en routing, 24 módulos en index, tabla de tests

### Tests (14 → 31 tests, 10 suites)

- formatter.mjs: 4 tests
- registry/rules.mjs: 4 tests
- detect.mjs inline ignores: 5 tests
- posttool.mjs: 1 test
- assay.mjs: 4 tests
- profile.mjs expandido a 8 tests

### Cambios en comandos

- `forge-state` → `forge state` (flags sin cambio)
- `forge-api` → `forge api`
- `hook` → `forge hook`
- `rollback` → `forge rollback`
- `update` → `forge update`
- `pin` → `nail`
- `unpin` → `unnail`
- Nuevo: `forge --help` con lista completa de comandos

### Mejoras internas

- `context.mjs`: Detección de monorepos (pnpm-workspace, turborepo, nx, lerna), workspaces
- `detect.mjs`: Integración con formatter, custom rules, naming checks
- `inspect.mjs`: `--diff` mode, sugerencias contextuales, persistencia de estado
- `graph.mjs`: Uso de `parseImportPaths` en lugar de regex inline
- `profile.mjs`: Perfil `express-drizzle`, detección de paquetes complementarios, `--suggest`

---

## v1.0.2 (2026-06-20)

- chore: update homepage to GitHub Pages site

## v1.0.1 (2026-06-20)

- chore: fix scope to match npm user @ronaldjdevfs

## v1.0.0 (2026-06-20)

- chore: prepare for npm public release
- docs: update README with BAOS architecture model and add DEVELOP.md
- feat: BAOS evolution — Platform/Features/Shared/Infra layers, ownership, naming patterns
- docs(README): robustecer documentación con secciones detalladas y logo
- Initial commit: Forge Architecture OS skill
