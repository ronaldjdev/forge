# 05 — Componentes

Inventario completo de todos los componentes de Forge v1.5.1.

## Scripts (30 archivos)

### Motor arquitectónico

| Script | Líneas | Propósito |
|--------|--------|-----------|
| `context.mjs` | ~300 | Construye el contexto completo del proyecto (stack, features, platform, shared, infra) |
| `graph.mjs` | ~500 | Construye el grafo arquitectónico (nodos + edges), valida R1-R9 |
| `detect.mjs` | ~1500 | Motor de detección de violaciones: imports, lógica en controllers, BD fuera de repos, inline ignores, naming |
| `chain.mjs` | ~200 | Análisis de dependencias multi-capa con orden topológico |
| `armorer.mjs` | ~300 | Reporte de ownership: huérfanos, duplicados, mal ubicados |

### Auditoría y scoring

| Script | Líneas | Propósito |
|--------|--------|-----------|
| `inspect.mjs` | ~360 | Auditoría completa: 11 categorías, score 0-100, output formateado |
| `assay.mjs` | ~500 | Ensayo multi-persona (Bezos, Fowler, Hacker, PM, Senior) |
| `recommendation-engine.mjs` | ~200 | Pipeline de comandos sugeridos según violaciones |

### Construcción

| Script | Líneas | Propósito |
|--------|--------|-----------|
| `bootstrap.mjs` | ~200 | Crea/verifica platform/, shared/, infra/ |
| `profile.mjs` | ~150 | Detecta perfil tecnológico (express-mongodb, etc.) |
| `architecture.mjs` | ~180 | Genera/actualiza ARCHITECTURE.md |
| `rename.mjs` | ~730 | Detección y corrección de naming violations |

### Hooks y protección

| Script | Líneas | Propósito |
|--------|--------|-----------|
| `forgeSentinel.mjs` | ~100 | Hook PostToolUse: análisis post-escritura |
| `forgeSentinel-lib.mjs` | ~150 | Lógica compartida del sentinel |
| `forgeSmith.mjs` | ~120 | Hook preToolUse (Cursor): puede denegar escrituras |
| `forgeSmith-admin.mjs` | ~100 | Administración de hooks |
| `hook.mjs` | ~80 | Git pre-commit hook |
| `posttool.mjs` | ~100 | PostToolUse hook genérico |

### Utilidades

| Script | Líneas | Propósito |
|--------|--------|-----------|
| `formatter.mjs` | ~120 | Colores ANSI, tablas, JSON, scoreBar |
| `parse-imports.mjs` | ~150 | Parser de imports ESM (AST + regex fallback) |
| `forge-config.mjs` | ~200 | Persistencia de config, estado, historial, cache |
| `forge-state.mjs` | ~80 | CLI wrapper de estado post-auditoría |
| `forge-signals.mjs` | ~60 | Señales de git (branch, changed files) |
| `forge-api.mjs` | ~150 | Validación de contratos API |
| `forge-boot.mjs` | ~100 | Orquestador de boot con profundidad condicional |
| `pin.mjs` | ~80 | Atajos de subcomandos (nail/unnail) |
| `rollback.mjs` | ~100 | Backup & restore |
| `update.mjs` | ~80 | Verificación de versiones |

### Registro

| Script | Líneas | Propósito |
|--------|--------|-----------|
| `registry/rules.mjs` | ~400 | Registro centralizado de reglas R1-R9, R13, R14 + custom |

## Templates (43 archivos)

### Feature templates (19)

| Template | Genera |
|----------|--------|
| `entity.ts.md` | Entidad de dominio |
| `repository-interface.ts.md` | Interfaz de repositorio (puerto) |
| `repository-impl.ts.md` | Implementación de repositorio |
| `use-case.ts.md` | Caso de uso |
| `controller.ts.md` | Controller HTTP |
| `routes.ts.md` | Rutas HTTP |
| `schema.ts.md` | Schema/validación |
| `mapper.ts.md` | Mapper DTO ↔ Entity |
| `di.ts.md` | Inyección de dependencias del feature |
| `test.ts.md` | Test unitario del caso de uso |
| `domain-error.ts.md` | Error de dominio |
| `domain-event.ts.md` | Evento de dominio |
| `event-handler.ts.md` | Handler de eventos |
| `outbox-repository.ts.md` | Repositorio con patrón outbox |
| `cqrs-query.ts.md` | Query CQRS |
| `saga-orchestrator.ts.md` | Orquestador de saga |
| `acl-gateway.ts.md` | Gateway ACL |
| `acl-repository.ts.md` | Repositorio ACL |
| `acl-translator.ts.md` | Traductor ACL |

### Platform templates (7)

| Template | Genera |
|----------|--------|
| `config.ts.md` | Configuración centralizada |
| `database.ts.md` | Conexión a base de datos |
| `di.ts.md` | Contenedor de DI global |
| `http.ts.md` | Setup HTTP |
| `logger.ts.md` | Logger configurado |
| `server.ts.md` | Server/boot |
| `outbox-relayer.ts.md` | Relayer del patrón outbox |

### Shared templates (4)

| Template | Genera |
|----------|--------|
| `contract.ts.md` | Contrato/interface compartido |
| `error.ts.md` | Error base compartido |
| `type.ts.md` | Tipo TypeScript compartido |
| `util.ts.md` | Utilidad pura compartida |

### Infra templates (4)

| Template | Genera |
|----------|--------|
| `prisma.ts.md` | Cliente Prisma |
| `mongodb.ts.md` | Cliente MongoDB/Mongoose |
| `redis.ts.md` | Cliente Redis |
| `mail.ts.md` | Cliente de mail |

### Agent templates (7)

| Template | Agente |
|----------|--------|
| `SKILL.md.template` | Base para todos los agentes |
| `claude/CLAUDE.md` | Claude Code |
| `claude/settings.local.json` | Config Claude |
| `cursor/.cursorrules` | Cursor |
| `cursor/hooks.json` | Hooks Cursor |
| `codex/hooks.json` | Hooks Codex |
| `gemini/SKILL.md` | Gemini |
| `opencode/SKILL.md` | OpenCode |
| `agents/hooks.json` | Hooks genéricos |

## Perfiles (10)

| Perfil | Framework | DB | ORM |
|--------|-----------|-----|-----|
| express-mongodb | Express | MongoDB | Mongoose |
| express-prisma | Express | PostgreSQL | Prisma |
| express-postgres | Express | PostgreSQL | native pg |
| express-drizzle | Express | PostgreSQL | Drizzle |
| fastify-mongodb | Fastify | MongoDB | Mongoose |
| fastify-prisma | Fastify | Prisma | Prisma |
| fastify-postgres | Fastify | PostgreSQL | native pg |
| nestjs-mongodb | NestJS | MongoDB | Mongoose |
| nestjs-prisma | NestJS | PostgreSQL | Prisma |
| nestjs-postgres | NestJS | PostgreSQL | TypeORM |

## Reference docs (36)

### Comandos (13)
help, forge, cast, inspect, quench, relocate, reforge, temper, smelt, chain, inscribe, assay, hooks

### Patrones y principios (11)
principles, patterns, errors, di-strategies, events, data-patterns, testing-patterns, security-patterns, observability, api-design, api-versioning

### Arquitectura estratégica (9)
bounded-contexts, modular-monolith, evolutionary-architecture, cqrs, sagas, transactional-outbox, idempotency, anti-corruption-layer, adr

### Checklists (3)
architecture-template, architectural-depth-checklist, cohesion-checklist
