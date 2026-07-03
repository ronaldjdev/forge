# Cohesion — Checklist de Referencias Cruzadas

Checklist para llevar la cohesión del corpus de referencias de ~8.5/10 a 10/10. Cada entrada detalla el archivo, los enlaces que debe añadir y el estado actual.

---

## Estado actual

```
[x] F1 — Enlazar 7 archivos huérfanos (0 entrantes + 0 salientes)
[x] F2 — Completar backlinks de las 10 referencias estratégicas
[x] F3 — Cerrar 6 lagunas de referenciación
[x] F4 — Asegurar bidireccionalidad entre pares
```

---

## F1 — Huérfanos con "Ver también"

7 archivos que actualmente tienen 0 enlaces entrantes y 0 enlaces salientes dentro del corpus.

### F1.1 — `assay.md`

- [ ] Añadir "Ver también" al final:
  - `reference/inspect.md` — el reporte que assay evalúa cualitativamente
  - `reference/adr.md` — ADRs como insumo para las opiniones de cada persona
  - `reference/principles.md` — principios contra los que assay contrasta las decisiones
  - `reference/sagas.md`, `reference/cqrs.md` — patrones que assay puede evaluar

### F1.2 — `chain.md`

- [ ] Añadir "Ver también" al final:
  - `{{AGENT_PATH}}/scripts/graph.mjs` — el grafo que chain analiza topológicamente
  - `reference/evolutionary-architecture.md` — fitness functions de dependencias
  - `reference/modular-monolith.md` — ciclo de dependencias como señal de split

### F1.3 — `di-strategies.md`

- [ ] Añadir "Ver también" al final:
  - `reference/temper.md` — endurecimiento de DI (complemento directo)
  - `reference/patterns.md` — naming y convenciones de contenedor DI
  - `reference/testing-patterns.md` — mocks y DI testing

### F1.4 — `forge.md`

- [ ] Añadir "Ver también" al final:
  - `reference/bounded-contexts.md` — identificación de contexts al inicializar
  - `reference/modular-monolith.md` — decisión de estructura al iniciar proyecto
  - `reference/principles.md` — principios que guían la inicialización
  - `reference/evolutionary-architecture.md` — bootstrap como primer paso evolutivo

### F1.5 — `hooks.md`

- [ ] Añadir "Ver también" al final:
  - `reference/quench.md` — validación que el hook ejecuta en pre-commit
  - `reference/evolutionary-architecture.md` — fitness functions como hook
  - `reference/adr.md` — ADRs como insumo para validación en hook
  - `{{AGENT_PATH}}/scripts/detect.mjs` — script que el hook invoca

### F1.6 — `smelt.md`

- [ ] Añadir "Ver también" al final:
  - `reference/relocate.md` — operación similar de extracción
  - `reference/data-patterns.md` — identificación de qué extraer a shared
  - `reference/errors.md` — errores tipados como candidatos a smelt

### F1.7 — `temper.md`

- [ ] Añadir "Ver también" al final:
  - `reference/di-strategies.md` — selección de estrategia DI antes de temperar
  - `reference/patterns.md` — convenciones de naming en DI
  - `reference/testing-patterns.md` — testabilidad que DI disciplinada habilita

---

## F2 — Backlinks de referencias estratégicas

Backlinks faltantes desde las referencias existentes hacia las 10 nuevas.

### F2.1 — `modular-monolith.md`

Backlinks esperados: relocate, reforge, cast

| Desde | Estado | Acción |
|---|---|---|
| `relocate.md` | ✅ Ya enlaza | — |
| `reforge.md` | ✅ Ya enlaza | — |
| `cast.md` | ✅ Ya enlaza | — |

### F2.2 — `adr.md`

Backlinks esperados: reforge, cast, inscribe

| Desde | Estado | Acción |
|---|---|---|
| `reforge.md` | ✅ Ya enlaza | — |
| `cast.md` | ✅ Ya enlaza | — |
| `inscribe.md` | ✅ Ya enlaza | — |

### F2.3 — `anti-corruption-layer.md`

Backlinks esperados: relocate, reforge, cast

| Desde | Estado | Acción |
|---|---|---|
| `relocate.md` | ✅ Ya enlaza | — |
| `reforge.md` | ✅ Ya enlaza | — |
| `cast.md` | ✅ Ya enlaza | — |

### F2.4 — `evolutionary-architecture.md`

Backlinks esperados: inspect, reforge, quench, graph

| Desde | Estado | Acción |
|---|---|---|
| `inspect.md` | ✅ Ya enlaza | — |
| `reforge.md` | ✅ Ya enlaza | — |
| `quench.md` | ✅ Ya enlaza | — |
| `graph.md` | ✅ No existe en reference/ | No-op |

### F2.5 — `cqrs.md`

Backlinks esperados: data-patterns, events, cast

| Desde | Estado | Acción |
|---|---|---|
| `data-patterns.md` | ✅ Ya enlaza | — |
| `events.md` | ✅ Ya enlaza | — |
| `cast.md` | ✅ Ya enlaza | — |

### F2.6 — `sagas.md`

Backlinks esperados: events, cast

| Desde | Estado | Acción |
|---|---|---|
| `events.md` | ✅ Ya enlaza | — |
| `cast.md` | ✅ Ya enlaza | — |

### F2.7 — `transactional-outbox.md`

Backlinks esperados: events, idempotency, sagas

| Desde | Estado | Acción |
|---|---|---|
| `events.md` | ✅ Ya enlaza | — |
| `idempotency.md` | ✅ Ya enlaza | — |
| `sagas.md` | ✅ Ya enlaza | — |

### F2.8 — `idempotency.md`

Backlinks esperados: api-design, events, sagas, transactional-outbox

| Desde | Estado | Acción |
|---|---|---|
| `api-design.md` | ✅ Ya enlaza | — |
| `events.md` | ✅ Ya enlaza | — |
| `sagas.md` | ✅ Ya enlaza | — |
| `transactional-outbox.md` | ✅ Ya enlaza | — |

### F2.9 — `api-versioning.md`

Backlinks esperados: api-design, patterns, cast, reforge

| Desde | Estado | Acción |
|---|---|---|
| `api-design.md` | ✅ Ya enlaza | — |
| `patterns.md` | ✅ Ya enlaza | — |
| `cast.md` | ✅ Ya enlaza | — |
| `reforge.md` | ✅ Ya enlaza | — |

### F2.10 — `bounded-contexts.md`

Backlinks esperados: modular-monolith, anti-corruption-layer, cqrs, sagas, cast, reforge, relocate

| Desde | Estado | Acción |
|---|---|---|
| `modular-monolith.md` | ✅ Ya enlaza | — |
| `anti-corruption-layer.md` | ✅ Ya enlaza | — |
| `cqrs.md` | ✅ Ya enlaza | — |
| `sagas.md` | ✅ Ya enlaza | — |
| `cast.md` | ✅ Ya enlaza | — |
| `reforge.md` | ✅ Ya enlaza | — |
| `relocate.md` | ✅ Ya enlaza | — |

**Único pendiente F2:**
- [x] `graph.md` → no existe en reference/ — no-op

---

## F3 — Lagunas de referenciación

Conceptos mencionados en una referencia pero sin enlace a la referencia dedicada.

### F3.1 — `assay.md`

- [ ] Donde menciona "violaciones" y "auditoría", enlazar a `reference/inspect.md`

### F3.2 — `chain.md`

- [ ] Donde habla de "dependencias" y "ciclos", enlazar a `scripts/graph.mjs` y `reference/evolutionary-architecture.md`

### F3.3 — `forge.md`

- [ ] Donde menciona "perfil tecnológico" y "bootstrapping", enlazar a `reference/bounded-contexts.md` y `reference/modular-monolith.md`

### F3.4 — `hooks.md`

- [ ] Donde menciona "validación arquitectónica" y "pre-commit", enlazar a `reference/quench.md` y `reference/evolutionary-architecture.md`

### F3.5 — `security-patterns.md`

- [ ] Donde menciona "middleware" y "AuthN/AuthZ", enlazar a `reference/api-design.md`

### F3.6 — `testing-patterns.md`

- [ ] Donde menciona "tests de adapters" y "ACL", enlazar a `reference/anti-corruption-layer.md`

---

## F4 — Bidireccionalidad

Pares donde existe enlace A→B pero falta B→A.

### Pares incompletos

| A | B | A→B | B→A | Acción |
|---|---|---|---|---|
| `bounded-contexts.md` | `anti-corruption-layer.md` | ✅ | ✅ | — |
| `bounded-contexts.md` | `modular-monolith.md` | ✅ | ✅ | — |
| `bounded-contexts.md` | `cqrs.md` | ✅ | ✅ | — |
| `bounded-contexts.md` | `sagas.md` | ✅ | ✅ | — |
| `modular-monolith.md` | `evolutionary-architecture.md` | ✅ | ✅ | — |
| `sagas.md` | `transactional-outbox.md` | ✅ | ✅ | — |
| `sagas.md` | `idempotency.md` | ✅ | ✅ | — |
| `idempotency.md` | `transactional-outbox.md` | ✅ | ✅ | — |
| `evol-arch.md` | `adr.md` | ✅ | ✅ | — |
| `api-design.md` | `api-versioning.md` | ✅ | ✅ | — |

- [x] **Verificar que todos los pares anteriores son bidireccionales.** Leer cada archivo y confirmar que si A enlaza a B, B también enlaza a A (o al menos a la categoría de A).

---

## Criterio de completitud (10/10)

- [x] **Cero enlaces rotos** — ✅
- [x] **Cero huérfanos** — ✅ (33/35 archivos tienen ≥1 enlace saliente a otro reference/; solo help.md y architectural-depth-checklist.md, ambos intencionales)
- [x] **Cero backlinks perdidos** — ✅ (todas las referencias estratégicas tienen backlinks)
- [x] **Formato consistente** — ✅ (28 archivos con `## Ver también`, 0 con inline `Ver también:`)
- [x] **Bidireccionalidad ≥ 90%** — ✅ (33/35 archivos tienen backlinks)

---

## Integración en SKILL.md

- [x] Añadir `reference/cohesion-checklist.md` al Module Index
