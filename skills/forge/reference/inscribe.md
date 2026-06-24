# Inscribe

Genera y mantiene el archivo `ARCHITECTURE.md` del proyecto.

## Cuándo usarlo

- Proyecto nuevo (crear ARCHITECTURE.md inicial)
- Después de migrar un feature (actualizar estado)
- Después de refactorizar (actualizar decisiones)
- Cuando se detecta que ARCHITECTURE.md está desactualizado
- On demand: `forge inscribe`

## Formato generado

```md
# Architecture

Project Name: <detectado>
Framework: <detectado>
Runtime: <detectado>
Database: <detectado>
ORM: <detectado>
DI Strategy: <detectado>
Architecture: hexagonal-feature-graph
Feature Convention: PascalCase
Naming Convention: camelCase
Testing Strategy: <según perfil>
Cross Feature Rules: inyección de interfaces, no imports directos
Dependency Rules: unidireccional, graph-driven
Active Profile: <detectado>
Last Audit: <fecha> (score: <puntaje>)
Migrated Features: [<lista>]
Legacy Features: [<lista>]

---

## Architecture Graph

**Nodes:** 12
**Edges:** 14
**Risk Score:** 85/100
**Health:** degraded

### Core Layer
- `core:shared` — shared

### Feature Layer
- `feature:users` — users
- `feature:payments` — payments

### Domain Layer
- `domain:users` — users/domain
- `domain:payments` — payments/domain

### Infra Layer
- `infra:prisma` — Prisma ORM

### Adapters
- `adapter:users` — users/adapters

### Violations
| Rule | From | To | Severity | Description |
|------|------|----|----------|-------------|
| R3 | `feature:users` | `infra:prisma` | CRITICAL | Features no acceden infraestructura directamente |

### Dependency Graph
- `feature:users` → [domain:users, adapter:users, infra:prisma (VIOLATION)]
```

## Campos auto-detectados

| Campo | Fuente |
|---|---|
| Framework | `scripts/context.mjs` |
| Database | `scripts/context.mjs` |
| ORM | `scripts/context.mjs` |
| DI Strategy | `scripts/context.mjs` |
| Active Profile | `scripts/profile.mjs` |
| Migrated Features | `scripts/context.mjs` → features.migrated |
| Legacy Features | `scripts/context.mjs` → features.legacy |
| Last Audit | `scripts/inspect.mjs` → fecha + score |
| Architecture Graph | `scripts/graph.mjs` |
| Risk Score | `scripts/graph.mjs` → stats.riskScore |
| Violations | `scripts/graph.mjs` → violations |

## Reglas

- ARCHITECTURE.md se guarda en la raíz del proyecto
- Forge lo lee antes de cada ejecución
- Si está desactualizado (última auditoría > 7 días), Forge sugiere actualizarlo
- No editar manualmente los campos auto-detectados
- Forge preserva cualquier sección adicional que el usuario agregue
