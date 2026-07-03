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

## Boot Sequence

ANTES de cualquier acción, Forge DEBE ejecutar `forge-boot.mjs` con la profundidad adecuada al comando:

```bash
boot=$(node {{AGENT_PATH}}/scripts/forge-boot.mjs --depth <depth> --json 2>/dev/null)
```

La profundidad (`--depth`) depende del comando (ver Execution Flow):
- **minimal** → context + profile (cast, temper, smelt, relocate, reforge, inscribe)
- **standard** → minimal + graph + chain (chain, graph, forge hook)
- **full** → standard + ownership + inspect (inspect, quench, default)

Si `$boot` contiene datos cacheados en `.forge/cache/` se reusan automáticamente. Pasa `--force` para regenerar.

---

## Command Routing

| Intención | Comando | Referencia |
|---|---|---|
| Ayuda | `forge --help` | `reference/help.md` |
| Setup inicial | `forge` | `reference/forge.md` |
| Crear feature | `cast` | `reference/cast.md` |
| Auditar | `inspect` | `reference/inspect.md` |
| Relocalizar feature | `relocate` | `reference/relocate.md` |
| Refactorizar | `reforge` | `reference/reforge.md` |
| Verificar violaciones | `quench` | `reference/quench.md` |
| Endurecer | `temper` | `reference/temper.md` |
| Dependencias | `chain` | `scripts/chain.mjs` |
| Inscribir ARCHITECTURE.md | `inscribe` | `reference/inscribe.md` |
| Grafo arquitectónico | `graph` | `scripts/graph.mjs` |
| Fundir a shared | `smelt` | `reference/smelt.md` |
| Atajo / pin | `nail` / `unnail` | `scripts/pin.mjs` |
| Git hook | `forge hook` | `reference/hooks.md` |
| API design | `forge api` | `scripts/forge-api.mjs` |
| Rollback | `forge rollback` | `scripts/rollback.mjs` |
| Estado | `forge state` | `scripts/forge-state.mjs` |
| Ensayo cualitativo | `assay` | `reference/assay.md` |
| Bounded context | `forge` | `reference/bounded-contexts.md` |
| Modular monolith | `forge` | `reference/modular-monolith.md` |
| ADR | `inscribe` | `reference/adr.md` |
| Anti-corruption layer | `relocate` | `reference/anti-corruption-layer.md` |
| Evolutionary arch | `reforge` | `reference/evolutionary-architecture.md` |
| CQRS | `cast` | `reference/cqrs.md` |
| Sagas | `cast` | `reference/sagas.md` |
| Outbox | `cast` | `reference/transactional-outbox.md` |
| Idempotencia | `forge` | `reference/idempotency.md` |
| API versioning | `forge api` | `reference/api-versioning.md` |

---

## Execution Flow

Para cada comando, Forge sigue este flujo:

1. **Boot condicional**: Ejecutar `forge-boot.mjs --depth <depth>` donde depth es:
   - `minimal` para cast, temper, smelt, relocate, reforge, inscribe
   - `standard` para chain, graph, forge hook
   - `full` para inspect, quench, o cualquier otro comando
2. **Referencia**: Cargar `reference/<command>.md`
3. **Ejecutar**: Aplicar el flujo definido en la referencia
4. **Verificar**: Ejecutar `detect.mjs --summary` (resumen compacto)
5. **Actualizar ARCHITECTURE.md**: `architecture.mjs` (solo en full)
6. **Reportar**: Mostrar resultado al usuario con severidades

El boot usa caché de `.forge/cache/`. Si los archivos `src/` no cambiaron, los datos se reusan. Usa `forge-boot.mjs --force` para regenerar todo.

---

## Routing Rules

- Si el lenguaje natural matchea exactamente un comando, ejecutarlo directamente.
- Si hay ambigüedad, preguntar al usuario: "¿Quieres decir: cast, relocate o reforge?"
- Si el comando requiere un perfil que no está detectado, preguntar antes de continuar.
- Si el proyecto no tiene `src/features/` y el comando es `cast`, sugerir `forge` primero.
- Si el proyecto no tiene `src/platform/`, ejecutar `bootstrapPlatform()` automáticamente.
- Si `ARCHITECTURE.md` está desactualizado (fecha de auditoría > 7 días), sugerir `forge inscribe`.
- Todos los resultados se muestran con severidades: `[CRITICAL]`, `[ERROR]`, `[WARNING]`, `[INFO]`, `[SUGGESTION]`.

### ⚠️ Regla de Platform: Sin lógica de dominio

Cuando `reforge` o `relocate` operen sobre `src/platform/`, verificar que los archivos movidos/creados no contengan lógica de dominio:

- **No** mover entidades, value objects, casos de uso, mappers de dominio, schemas de entidades, repositorios de dominio a `platform/`
- **No** crear archivos con sufijos `.entity.ts`, `.uc.ts`, `.mapper.ts`, `.repository.ts` (domain), `.port.ts` dentro de `platform/`
- **No** importar desde `features/` dentro de `platform/` (viola R2)
- Si un componente tiene imports hacia `domain/` o `features/`, pertenece a un feature, no a platform

Platform solo acepta: config, database, http, server, logger, cache, security, events, scheduler, observability, di.

### Inline Ignores

Forge soporta comentarios inline para excepcionar violaciones línea por línea:

```ts
// forge-ignore-next-line
import { something } from "../infra/prisma";  // ← esta línea no se reporta

// forge-ignore: R1
import { PrismaClient } from "../../infra/prisma/client"; // ← solo R1 ignorada

// forge-ignore: R1, R8
import { crossFeature } from "../other-feature/domain/Entity"; // ← R1 y R8 ignoradas
```

---

## ARCHITECTURE.md

Forge mantiene `ARCHITECTURE.md` en la raíz con el estado persistente del proyecto (framework, DB, features, ownership, graph). Se genera y actualiza con `architecture.mjs`.

El agente DEBE leer este archivo al inicio de cada interacción y actualizarlo al finalizar cada comando. Ver `scripts/architecture.mjs` para el formato completo.

---

> 📚 Todas las referencias están en `reference/`. La tabla de routing arriba mapea cada comando a su referencia. Ver `reference/help.md` para la lista completa de flags.

### Tests

Forge incluye tests unitarios con `node:test` (sin dependencias externas).

```bash
node --test {{AGENT_PATH}}/tests/core.test.mjs
```

| Módulo | Tests | Descripción |
|--------|-------|-------------|
| `profile.mjs` | 8 | Detección de perfiles |
| `graph.mjs` | 1 | Grafo vacío |
| `armorer.mjs` | 1 | Ownership vacío |
| `forge-config.mjs` | 2 | Load/save state |
| `chain.mjs` | 1 | Grafo de dependencias vacío |
| `formatter.mjs` | 4 | Output format, colores, JSON |
| `registry/rules.mjs` | 4 | R1-R9, evaluación, custom rules |
| `detect.mjs` (inline ignores) | 5 | parseInlineIgnores, isIgnored |
| `posttool.mjs` | 1 | PostToolUse hook |
| `assay.mjs` | 4 | Personas, generateAssay, opiniones |
| transactional-outbox | 5 | Entry lifecycle, retry, DLQ, required fields, pending |
| idempotency | 5 | UUID validation, cached response, different keys, TTL, method filter |
| anti-corruption-layer | 5 | DTO mapping (2 dirs), null handling, 404, delegation order |

### Flags adicionales

| Flag | Comando | Descripción |
|------|---------|-------------|
| `--fix` | `quench` | Auto-corrige violaciones WARNING/INFO (missing @injectable(), tsconfig, naming, container.resolve) |
| `--auto` | `quench` | Itera fix → re-detect → fix hasta estabilizar violaciones auto-corregibles |
| `--show-ignores` | `quench` | Muestra los inline ignores encontrados en el código |
| `--persona=<id>` | `assay` | Filtra ensayo por una persona (bezos, fowler, hacker, pm, senior) |
| `--save` | `assay` | Persiste ensayo en `.forge/assay/` |
| `--json` | `assay` | Salida JSON |
