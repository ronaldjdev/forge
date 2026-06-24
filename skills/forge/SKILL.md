---
name: forge
description: >
  Architecture Operating System especializado en diseñar, construir, auditar,
  proteger y evolucionar arquitecturas backend escalables basadas en features
  (vertical slices), hexagonal architecture y DDD pragmático. Triggers:
  "arquitectura", "migrar", "refactorizar", "features", "hexagonal",
  "puertos y adaptadores", "clean architecture", "cast", "inspect",
  "quench", "chain", "grafo", "graph", "nodo", "architecture graph",
  "violaciones", "ownership", "platform", "infraestructura". Excluye
  infraestructura (Docker, CI/CD), optimización de queries y cambios de
  lógica de negocio sin reestructuración.
---

# Forge — Backend Architecture Operating System

Forge es un **sistema operativo arquitectónico**. Diseña, construye, audita, protege y evoluciona arquitecturas backend completas. Opera sobre cualquier stack moderno modelando **cuatro dominios arquitectónicos**: **Platform**, **Features**, **Shared** e **Infrastructure**.

No es un template ni una guía. Es un orquestador.

---

## Modelo Arquitectónico

Todo backend se modela en cuatro dominios:

| Layer | Propósito | Ejemplos |
|-------|-----------|----------|
| **Platform** | Backbone técnico global | config, database, http, server, logger, cache, security, events, di |
| **Features** | Capacidades de negocio | auth, users, payments |
| **Shared** | Componentes reutilizables puros | errors, contracts, types, utils |
| **Infrastructure** | Implementaciones concretas | prisma, mongodb, redis, mail |

### Dependency Rules

Permitido:
- `feature → platform`
- `feature → shared`
- `platform → infra`
- `adapter → infra`
- `feature → domain`

Prohibido:
- `feature → infra`
- `platform → feature`
- `shared → feature`
- `shared → infra`
- `domain → infra`
- `domain → platform`
- `infra → feature`

---

## Architecture Guidance

Ver `reference/principles.md` para el manifiesto completo y los 12 principios inquebrantables.
Ver `reference/patterns.md` para las convenciones de nomenclatura (PascalCase.artifact, kebab dirs, etc.).
En esencia:

| Principio | Regla |
|---|---|
| Cuatro dominios arquitectónicos | Platform, Features, Shared, Infrastructure con ownership estricto |
| Unidades autónomas | Cada feature es dueño de su dominio, aplicación y adapters |
| Dependencias unidireccionales | adapters → application → domain → (nada) |
| Cero lógica en controllers | El controller parsea, delega y responde |
| Cero BD fuera de repositorios | Los repositories son la única puerta a datos |
| DI disciplinada | Constructor injection, sin service locators |
| Cero acoplamiento directo entre features | Siempre vía interfaces inyectadas |
| Ownership obligatorio | Cada componente tiene un único propietario arquitectónico |

---

## Boot Sequence (OBLIGATORIO — ejecutar siempre antes de responder)

ANTES de cualquier acción, Forge DEBE ejecutar esta secuencia. Si no lo haces, puedes dar respuestas incorrectas:

1. **context.mjs** — Detectar stack, platform, features, shared, infra, grafo, estado
2. **armorer.mjs** — Detectar ownership, huérfanos, duplicados, mal ubicados
3. **profile.mjs** — Determinar perfil tecnológico
4. **graph.mjs** — Construir grafo arquitectónico global (4 capas + 9 reglas)
5. **chain.mjs** — Analizar dependencias multi-capa
6. **inspect.mjs** — Auditoría completa con ownership + platform
7. **architecture.mjs** — Generar/actualizar ARCHITECTURE.md
8. **Ejecutar comando solicitado** — cast, quench, temper, etc.
9. **Actualizar ARCHITECTURE.md** — Reflejar nuevo estado

```bash
# Template de setup que debes ejecutar:
ctx=$(node .opencode/skills/forge/scripts/context.mjs --json 2>/dev/null)
armorer=$(node .opencode/skills/forge/scripts/armorer.mjs --json 2>/dev/null)
profile=$(node .opencode/skills/forge/scripts/profile.mjs --extended 2>/dev/null)
graph=$(node .opencode/skills/forge/scripts/graph.mjs --json 2>/dev/null)
deps=$(node .opencode/skills/forge/scripts/chain.mjs --json 2>/dev/null)
inspect=$(node .opencode/skills/forge/scripts/inspect.mjs --json 2>/dev/null)
```

---

## Command Routing

| Lenguaje natural | Comando | Archivo |
|---|---|---|
| "inicializar", "setup", "empezar" | `forge` | `reference/forge.md` |
| "crear feature", "nuevo dominio" | `cast` | `reference/cast.md` |
| "inspeccionar", "diagnóstico", "evaluar" | `inspect` | `reference/inspect.md` |
| "trasladar", "mover", "reestructurar feature" | `relocate` | `reference/relocate.md` |
| "refactorizar", "rediseñar", "cambiar estructura" | `reforge` | `reference/reforge.md` |
| "verificar", "quench", "checklist" | `quench` | `reference/quench.md` |
| "templar", "endurecer", "mejorar" | `temper` | `reference/temper.md` |
| "cadena", "grafo", "acoplamiento" | `chain` | `scripts/chain.mjs` |
| "inscribir", "grabar", "ARCHITECTURE.md" | `inscribe` | `reference/inscribe.md` |
| "grafo", "graph", "nodo", "violaciones", "risk score" | `graph` | `scripts/graph.mjs` |
| "fundir", "compartir", "mover a shared" | `smelt` | `reference/smelt.md` |
| "ownership", "huérfanos", "armorer" | `inspect` | (incluido en auditoría) |

---

## Execution Flow

Para cada comando, Forge sigue este flujo:

1. **Contexto**: Ejecutar `context.mjs` + `armorer.mjs` + `profile.mjs`
2. **Grafo**: Ejecutar `graph.mjs` + `chain.mjs`
3. **Auditoría**: Ejecutar `inspect.mjs`
4. **Referencia**: Cargar `reference/<command>.md`
5. **Ejecutar**: Aplicar el flujo definido en la referencia, usando los scripts según corresponda
6. **Verificar**: Ejecutar `scripts/detect.mjs` para verificar que no se introdujeron violaciones
7. **Actualizar ARCHITECTURE.md**: Reflejar el nuevo estado (`architecture.mjs`)
8. **Reportar**: Mostrar resultado al usuario con severidades

---

## Routing Rules

- Si el lenguaje natural matchea exactamente un comando, ejecutarlo directamente.
- Si hay ambigüedad, preguntar al usuario: "¿Quieres decir: cast, relocate o reforge?"
- Si el comando requiere un perfil que no está detectado, preguntar antes de continuar.
- Si el proyecto no tiene `src/features/` y el comando es `cast`, sugerir `forge` primero.
- Si el proyecto no tiene `src/platform/`, ejecutar `bootstrapPlatform()` automáticamente.
- Si `ARCHITECTURE.md` está desactualizado (fecha de auditoría > 7 días), sugerir `forge inscribe`.
- Todos los resultados se muestran con severidades: `[CRITICAL]`, `[ERROR]`, `[WARNING]`, `[INFO]`, `[SUGGESTION]`.

## ARCHITECTURE.md

Forge mantiene un archivo `ARCHITECTURE.md` en la raíz del proyecto con el contexto persistente. Contiene:

```md
# Architecture State

Project Name: <name>
Framework: <detectado>
Runtime: <detectado>
Database: <detectado>
ORM: <detectado>
DI Strategy: <detectado>
Profile: <detectado>
Architecture: hexagonal-feature (Platform + Features + Shared + Infra)
Last Audit: <fecha> (score: <puntaje>)

## Platform
- platform/config/
- platform/server/
...

## Features
- features/users/
...

## Shared
- shared/errors/
...

## Infrastructure
- infra/prisma/
...

## Ownership
Health: healthy | degraded | critical
Score: 0-100
Orphans: 0
Duplicates: 0
Misplaced: 0

## Architecture Graph
...

## Dependency Health
...
```

El agente DEBE leer este archivo al inicio de cada interacción y actualizarlo al finalizar cada comando.

---

## Module Index

| Módulo | Propósito |
|---|---|
| `reference/principles.md` | Manifiesto y 12 principios inquebrantables |
| `reference/patterns.md` | Convenciones de nomenclatura globales (PascalCase.artifact, kebab dirs, etc.) |
| `profiles/` | Perfiles tecnológicos detallados (Express, Fastify, NestJS, etc.) |
| `scripts/` | Scripts de análisis: context, detect, inspect, chain, profile, graph, architecture, armorer, bootstrap |
| `templates/feature/` | Templates de feature (entity, repository, uc, controller, routes, schema, mapper) |
| `templates/platform/` | Templates de platform (config, server, database, logger, http, di) |
| `templates/shared/` | Templates de shared (errors, contracts, types, utils) |
| `templates/infra/` | Templates de infra (prisma, mongodb, redis, mail) |
| `command/forge.md` | Definición del comando `/forge` para opencode |
