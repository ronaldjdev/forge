# CHANGELOG

## v1.3.3 — Fix I-prefix PascalCase en inspector (2026-06-30)

### Fixed
- **`rename.mjs`: Falso positivo con prefijo `I`**: `toPascalCase` aplanaba la letra tras `I` (ej. `ILogger.port.ts` → `Ilogger.port.ts`). Nuevo helper `toPascalCaseI` preserva la mayúscula en prefijos de interfaz. Afectaba a `domain/port`, `domain/entities` y `shared/contracts`.

---

## v1.3.2 — Domain Subdirectory Structure & Port Support (2026-06-30)

### Added
- **`rename.mjs`: Subdirectory domain structure**: `domain/entities/` y `domain/repositories/` como ubicaciones preferidas. `rename.mjs --all` migra automáticamente archivos planos a subdirectorios.
- **`rename.mjs`: `mkdirSync` automático**: Crea directorios `entities/` o `repositories/` si no existen durante el rename.
- **`rename.mjs`: Soporte `port` en domain**: Nuevo patrón `<Name>.port.ts` para interfaces de puerto en la capa de dominio.
- **`detect.mjs`: Validación de subdirectorios**: Reconoce `domain/entities/*.entity.ts` y `domain/repositories/*.repository.ts`; emite WARNING si encuentra archivos planos sugiriendo migración.

### Fixed
- **`rename.mjs --all`**: Bug de dobles extensiones (`.uc.uc.ts`, `.config.config.ts`) corregido. El handler de use-cases ahora extrae el sufijo `.uc` antes de aplicar `toPascalCase`.
- **ACL templates**: Nombres estandarizados (`ISagaRepository` → `ISagaRepository.repository.js`, `<Domain>Entity.js` → `<Domain>.entity.js`) con imports actualizados.

### Changed
- **Feature templates**: 9 templates actualizados con rutas a `domain/entities/` y `domain/repositories/`.
- **Estructura de feature recomendada**: Ahora `domain/entities/`, `domain/repositories/`, `domain/errors/`, `domain/events/` como subdirectorios estándar.

---

## v1.3.1 — Bugfixes, New Templates & Interactive Flags (2026-06-29)

### Fixed (16 issues)
- **R1-R5 fix suggestions**: Mensajes de fix ahora mapean correctamente a cada regla arquitectónica
- **checkCustomRules**: Ahora itera archivos reales de features en vez de strings vacías
- **rollback.mjs**: `import.meta.url` convertido con `fileURLToPath` — `forge rollback` ya no falla en verify
- **`--severity` filter**: Ahora filtra correctamente la salida en lugar de ser ignorado
- **graph.mjs**: `hasCycles` incluido en stats — ciclo de dependencias ahora se reporta vía `graph.stats.hasCycles`
- **inspect.mjs diff mode**: `maxScore` ahora es dinámico desde `CAT_MAX` en vez de hardcodeado a 60
- **forge-state / forge-config**: Score dinámico en vez de `/110` hardcodeado
- **architecture.mjs**: `maxScore` incluye todas las categorías (decorators, customRules, naming)
- **forge-boot.mjs**: `category` guarda el nombre string en vez del objeto entero
- **inspect.mjs**: `renderScoreBar` renombrado para evitar shadowing de import
- **architecture.mjs**: Agregado `process.argv[1]` guard
- **parse-imports.mjs**: Código muerto eliminado (segundo `parseWithAST` inalcanzable)
- **rollback.mjs + forge-config.mjs**: `/110` hardcodeado reemplazado por valor dinámico

### Added
- **forge-boot.mjs**: Boot orchestrator con profundidades minimal/standard/full y caché en `.forge/cache/`
- **recommendation-engine.mjs**: Pipeline automático post-auditoría con comandos sugeridos por severidad
- **14 reference docs**: ADR, Anti-Corruption Layer, API Versioning, Architectural Depth, Bounded Contexts, Cohesion Checklist, CQRS, Evolutionary Architecture, Idempotency, Modular Monolith, Sagas, Transactional Outbox, Architecture Template
- **6 feature templates**: acl-gateway, acl-repository, acl-translator, cqrs-query, outbox-repository, saga-orchestrator
- **1 platform template**: outbox-relayer
- **Flags interactivos**: Cada comando con flags (inspect, assay, graph, chain, quench, reforge, inscribe) ahora pregunta al usuario qué flags usar si no se pasan explícitamente

### Changed
- **CLI commands**: 14 comandos generados (antes 10) — se agregaron assay, graph, armorer, bootstrap
- **Todas las reference docs**: Frontmatter unificado con description y agent type
- **Tests**: 46 tests (antes 31), todos pasando

---

## v1.3.0-beta — Multi-Agent Hooks & npx Install (2026-06-26)

### Added
- **forgeSentinel** (PostToolUse): hook que analiza arquitectura automáticamente tras cada escritura en Claude Code, Codex CLI y agentes genéricos
- **forgeSmith** (preToolUse, Cursor): gate que puede DENEGAR escrituras con violaciones CRITICAL/ERROR antes de que ocurran
- **forgeSmith-admin**: gestión de hooks (on/off/status) para Cursor
- **forgeSentinel-lib**: lógica compartida entre hooks
- **posttool.mjs**: wrapper deprecated para compatibilidad hacia atrás
- **SKILL.md.template**: parametrización con `{{AGENT_PATH}}` — SKILL.md renderizado por agente sin duplicación
- **Templates por agente**: CLAUDE.md, .cursorrules, hooks.json, SKILL.md para Claude, Cursor, Codex, Gemini y agentes genéricos
- **Soporte npx probado**: `npx @ronaldjdevfs/forge install` funciona desde tarball (validado en temp dir)
- **Scripts de test**: `pnpm test:forgeSentinel`, `pnpm test:forgeSmith`, `pnpm test:pin`, `pnpm test:all`

### Changed
- Eliminada self-reference dependency (`@ronaldjdevfs/forge: link:`) para permitir publicación limpia en npm
- `install --all` despliega hooks funcionales en los 5 agentes simultáneamente

### Removed
- Dependencia `"@ronaldjdevfs/forge": "link:..."` para publish

---

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
