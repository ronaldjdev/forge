# 04 — Evolución (v1.0 → v1.5.1)

## Timeline

```
v1.0.0 ──→ v1.1.0 ──→ v1.2.0 ──→ v1.3.0 ──→ v1.3.1 ──→ v1.3.2 ──→ v1.3.5 ──→ v1.4.0 ──→ v1.4.1 ──→ v1.4.2 ──→ v1.4.3 ──→ v1.4.4 ──→ v1.5.0 ──→ v1.5.1
 Jun 23      Jun 25      Jun 28      Jun 30      Jul 01      Jul 02      Jul 03      Jul 05      Jul 06      Jul 08      Jul 16      Jul 20      Jul 25      Jul 26
```

## v1.0.0 — El nacimiento (23 Jun 2026)

**Commit inicial**: `27c2451` — "Initial commit: Forge Architecture OS skill"

Lo que incluía:
- `SKILL.md` con 132 líneas (modelo arquitectónico + routing básico)
- **7 scripts**: audit.mjs (luego inspect), context.mjs, armorer.mjs, profile.mjs, graph.mjs, chain.mjs, bootstrap.mjs
- **7 reference docs**: cast, chain, forge, inscribe, inspect, quench, reforge, relocate, smelt, temper
- **5 perfiles**: express-mongodb, express-postgres, express-prisma, fastify-postgres, nestjs-prisma
- **0 templates** de feature
- **0 hooks**
- **0 tests**

```bash
# Estructura inicial
skills/forge/
├── SKILL.md              ← 132 líneas
├── scripts/              ← 7 scripts
├── reference/            ← 10 docs
├── profiles/             ← 5 perfiles
└── command/forge.md      ← 1 comando
```

## v1.1.0 — La gran expansión (25 Jun 2026)

**14 scripts nuevos** en un solo commit. Este fue el salde de calidad más grande.

Nuevos módulos:
| Script | Propósito |
|--------|-----------|
| `formatter.mjs` | Output unificado con colores ANSI, JSON, scoreBar |
| `registry/rules.mjs` | Registro centralizado de reglas R1-R9 + custom |
| `assay.mjs` | Ensayo multi-persona (Bezos, Fowler, Hacker, PM, Senior) |
| `posttool.mjs` | Hook PostToolUse para análisis post-escritura |
| `forge-config.mjs` | Persistencia de config/state/history |
| `forge-state.mjs` | CLI wrapper de estado post-auditoría |
| `forge-signals.mjs` | Señales de git para contextualizar |
| `forge-api.mjs` | Validación de contratos API |
| `hook.mjs` | Git pre-commit hook management |
| `pin.mjs` | Atajos de navegación (nail/unnail) |
| `parse-imports.mjs` | Parsing de imports ESM con AST |
| `rename.mjs` | Renombrado bulk con actualización de imports |
| `rollback.mjs` | Backup & restore para migrate/relocate |
| `update.mjs` | Verificador de actualizaciones contra forge.dev |

Nuevas capacidades:
- Inline ignores (`// forge-ignore-next-line`, `// forge-ignore: R1`)
- Auto-fix (`--fix`) para @injectable, tsconfig, naming, container.resolve
- Ensayo multi-persona (5 perspectivas expertas)
- PostToolUse hook post-escritura

Perfiles: 5 → 10 (agregados express-drizzle, fastify-mongodb, fastify-prisma, nestjs-mongodb, nestjs-postgres)

Templates: 0 → 8 feature templates

Tests: 0 → 31 (10 suites)

## v1.2.0 — Multi-Agente (28 Jun 2026)

**Instalador interactivo** con `@clack/prompts`:
- Wizard de 4 fases: welcome → detection → selection → install
- Soporte para 5 agentes: OpenCode, Claude, Cursor, Codex, Gemini
- `src/cli.js` como entry point binario
- `src/wizard.mjs` como motor del wizard
- `src/agents.mjs` para detección de agentes instalados

## v1.3.0 — Hooks y npx (30 Jun 2026)

**Sistema de hooks** para protección en tiempo real:
- `forgeSentinel.mjs` — PostToolUse hook (análisis post-escritura)
- `forgeSmith.mjs` — preToolUse hook (puede denegar escrituras, solo Cursor)
- `forgeSmith-admin.mjs` — Administración de hooks
- Soporte para `npx forge install`

## v1.3.1 — Templates y Flags (1 Jul 2026)

- 11 feature templates (agregados: domain-error, domain-event, event-handler)
- Flags interactivos: `--fix`, `--auto`, `--show-ignores`, `--persona`, `--dry-run`
- Nuevo script: `recommendation-engine.mjs` (pipeline de comandos sugeridos)

## v1.3.2 — Domain Subdirectory (2 Jul 2026)

- Estructura `domain/entities/` y `domain/repositories/` (antes eran planos)
- Soporte para interfaces con prefijo I

## v1.3.5 — R13 Platform Domain Guard (3 Jul 2026)

- Regla R13: Platform no contiene lógica de dominio
- `checkPlatformForDomain()` en detect.mjs
- Legacy cleanup automatizado

## v1.4.0 — Forge Init y Auto-Fix (5 Jul 2026)

- `forge` como comando de inicialización (antes solo inspect)
- Auto-fix iterativo: aplica fixes y re-audita hasta 0 violaciones
- Inspect como modo por defecto (sin flags)

## v1.4.1 — Wizard Path Rendering (6 Jul 2026)

- Fix: `renderSkillPaths()` no se llamaba para Claude, Cursor, Codex, Gemini
- Todos los paths de scripts migrados a `{{AGENT_PATH}}/scripts/...`

## v1.4.2 — Templates Aislados (8 Jul 2026)

- `cleanAgentTemplates()` elimina subdirectorios de otros agentes
- Al instalar `--opencode`, solo se conserva `opencode/` en templates

## v1.4.3 — DI: feature/di.ts (16 Jul 2026)

- `feature/di.ts` como fuente única de registro por feature
- Eliminada redundancia entre `di.ts` y `app.ts`

## v1.4.4 — Sincronizar Reglas (20 Jul 2026)

- Reglas R1-R14 sincronizadas entre `registry/rules.mjs` y `detect.mjs`
- Severidades unificadas

## v1.5.0 — Adapters Organizados (25 Jul 2026)

- Subdirectorios: `controllers/`, `routes/`, `repositories/`, `schemas/`
- Estructura de feature ampliada con nested dirs

## v1.5.1 — Score Normalization (26 Jul 2026)

- Score total normalizado a 100 (antes variaba según categorías)
- Fixes de scoring: CAT_MAX.platform, checkPlatformForDomain, checkImportConventions, checkNaming
- severityCounts excluye INFO de violaciones
- architecture.mjs: CAT_MAX completo con platformDomain e importConventions

## Métricas de evolución

| Versión | Scripts | Templates | Profiles | References | Tests | Commits |
|---------|---------|-----------|----------|------------|-------|---------|
| v1.0.0 | 7 | 0 | 5 | 10 | 0 | 1 |
| v1.1.0 | 21 | 8 | 10 | 22 | 31 | 2 |
| v1.2.0 | 21 | 8 | 10 | 22 | 31 | 3 |
| v1.3.0 | 25 | 8 | 10 | 22 | 31 | 4 |
| v1.3.1 | 27 | 11 | 10 | 28 | 31 | 5 |
| v1.4.0 | 28 | 15 | 10 | 32 | 40 | 8 |
| v1.5.0 | 30 | 34 | 10 | 36 | 46 | 45 |
| v1.5.1 | 30 | 34 | 10 | 36 | 46 | 49 |
