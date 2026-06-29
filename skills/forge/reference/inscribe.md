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
# Architecture State

**Project Name:** <detectado>
**Framework:** <detectado>
**Runtime:** <detectado>
**Database:** <detectado>
**ORM:** <detectado>
**DI Strategy:** <detectado>
**Profile:** <detectado>
**Architecture:** hexagonal-feature (Platform + Features + Shared + Infra)
**Last Audit:** <fecha> (score: <puntaje>)

## Platform
- platform/config/
- platform/database/
- platform/http/
- platform/logger/

## Features
- features/users/
- features/payments/

## Shared
- shared/errors/
- shared/types/
- shared/utils/

## Infrastructure
- infra/prisma/
- infra/redis/

## Ownership
**Health:** healthy | degraded | critical
**Score:** 85/100
**Orphans:** 0
**Duplicates:** 0
**Misplaced:** 0

## Architecture Graph
**Nodes:** 15
**Edges:** 20
**Risk Score:** 12/100
**Health:** healthy
**Dependency Health:** 95%

### Platform Layer
- `platform:config` — config

### Feature Layer
- `feature:users` — users

### Shared Layer
- `shared:errors` — errors

### Infrastructure Layer
- `infra:prisma` — prisma

### Domain Layer
- `domain:users` — users/domain

### Adapter Layer
- `adapter:users` — users/adapters

### Violations
| Rule | From | To | Severity | Description |
|------|------|----|----------|-------------|
| R1 | `feature:users` | `infra:prisma` | CRITICAL | Features no acceden infraestructura directamente |

### Dependency Graph
- `feature:users` → [domain:users, adapter:users]

## Dependency Health
**Valid Edges:** 19/20
**Dependency Health:** 95%
**Risk Score:** 12/100
**Health:** healthy

## Violations
...

## Context
...

## Tech Stack
...
```

## Campos auto-detectados

| Campo | Fuente |
|---|---|
| Framework | `scripts/context.mjs` |
| Database | `scripts/context.mjs` |
| ORM | `scripts/context.mjs` |
| DI Strategy | `scripts/context.mjs` |
| Active Profile | `scripts/profile.mjs` |
| Platform | `scripts/context.mjs` → platform |
| Features | `scripts/context.mjs` → features |
| Shared | `scripts/context.mjs` → shared |
| Infra | `scripts/context.mjs` → infra |
| Ownership | `scripts/armorer.mjs` |
| Architecture Graph | `scripts/graph.mjs` |
| Risk Score | `scripts/graph.mjs` → stats.riskScore |
| Violations | `scripts/graph.mjs` → violations |
| Last Audit | `scripts/inspect.mjs` → fecha + score |

## Reglas

- ARCHITECTURE.md se guarda en la raíz del proyecto
- Forge lo lee antes de cada ejecución
- Si está desactualizado (última auditoría > 7 días), Forge sugiere actualizarlo
- Se actualiza automáticamente después de cada comando
- No editar manualmente los campos auto-detectados
- Forge preserva cualquier sección adicional que el usuario agregue

## Ver también

- `reference/adr.md` — Architecture Decision Records como insumo para ARCHITECTURE.md
- `reference/principles.md` — principios arquitectónicos documentados en ARCHITECTURE.md
