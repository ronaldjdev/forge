# Architectural Depth — Checklist de Referencias

Checklist de las 10 nuevas referencias estratégicas para Forge. Cada entrada define el alcance exacto, secciones obligatorias, relaciones con referencias existentes y criterio de completitud.

---

## Estado actual

```
[x] 01 — bounded-contexts.md      — DDD Estratégico
[x] 02 — modular-monolith.md      — Estrategia de despliegue
[x] 03 — adr.md                   — Registro de decisiones
[x] 04 — anti-corruption-layer.md — Integración legacy
[x] 05 — evolutionary-architecture.md — Evolución arquitectónica
[x] 06 — cqrs.md                  — CQRS
[x] 07 — sagas.md                 — Transacciones distribuidas
[x] 08 — transactional-outbox.md  — Fiabilidad de eventos
[x] 09 — idempotency.md           — Idempotencia
[x] 10 — api-versioning.md        — Evolución de contratos
```

---

## 01 — `bounded-contexts.md`

**Propósito:** Fundamentar la capa `features/` en DDD Estratégico. Sin bounded contexts, las features son sólo directorios.

**Depende de:** nada (fundacional)
**Es usado por:** `modular-monolith.md`, `anti-corruption-layer.md`, `cqrs.md`, `sagas.md`

### Secciones obligatorias

- [ ] **Fundamentos de DDD Estratégico**: dominio, subdominio (core/supporting/generic), bounded context
- [ ] **Ubiquitous Language**: por contexto, glosario compartido, conflictos de lenguaje
- [ ] **Context Mapping**: Partnership, Shared Kernel, Customer-Supplier, Conformist, Anti-Corruption Layer, Open-Host Service, Published Language, Separate Ways
- [ ] **Identificación de bounded contexts**: heurísticas (equipo, lenguaje, modelo, base de datos)
- [ ] **Mapeo visual**: diagrama de contexts con relaciones y flujos
- [ ] **Relación con el modelo de Forge**: cómo cada feature se corresponde con (parte de) un bounded context
- [ ] **Anti-patrones**: contextos gigantes (orphan core), contextos fantasma, contextos sin lenguaje
- [ ] **Ejemplo completo**: sistema de e-commerce con 4-5 bounded contexts mapeados
- [ ] **Conexión con reglas R8 y R9**: cómo los contextos prohíben acoplamiento directo y ciclos

### Criterio de completitud

Un lector puede tomar cualquier feature existente y determinar su bounded context, su relación con otros contexts, y si el mapeo actual viola algún patrón de integridad.

---

## 02 — `modular-monolith.md`

**Propósito:** Proveer un marco de decisión para elegir entre monolith modular y microservicios, alineado con el modelo de 4 capas.

**Depende de:** `bounded-contexts.md`
**Es usado por:** `relocate.md`, `reforge.md`, `cast.md`

### Secciones obligatorias

- [ ] **Definición de modular monolith**: módulos con boundaries fuertes, mismo proceso, despliegue único
- [ ] **Espectro Monolith → Modular → Microservices**: continuo, no binario
- [ ] **Marco de decisión**: cohesión, acoplamiento, topología de equipo (Conway's Law), escalabilidad, deployment autonomy
- [ ] **Cuándo mantener monolith**: equipo pequeño, dominio cohesionado, latencia crítica, inicio incierto
- [ ] **Señales para partir**: equipo scaling, deployment bottleneck, boundaries maduros, different failure characteristics
- [ ] **Criterio de corte por capa**: qué puede vivir como servicio vs qué debe compartirse (shared, platform)
- [ ] **Integración con Forge**: cómo modelar módulos usando features existentes, qué reglas (R8) se relajan dentro del monolith
- [ ] **Transición controlada**: split de features sin reescritura (strangler fig aplicado a features)
- [ ] **Anti-patrones**: distributed monolith, premature splitting, shared database entre servicios, nano-services
- [ ] **Ejemplo**: monolith modular de SaaS facturación que eventualmente parte billing en servicio separado

### Criterio de completitud

Un equipo puede evaluar su arquitectura actual contra el marco de decisión y obtener una recomendación accionable sobre si partir o consolidar y por dónde empezar.

---

## 03 — `adr.md`

**Propósito:** Capturar y preservar decisiones arquitectónicas como parte del workflow de Forge.

**Depende de:** nada
**Es usado por:** `reforge.md`, `cast.md`, `inscribe.md`, todos

### Secciones obligatorias

- [ ] **Formato ADR estándar**: Title, Status, Context, Decision, Consequences (plantilla)
- [ ] **Variantes**: ADR simple (5 secciones), ADR extendido (con alternatives, compliance), ADR ligero (1 párrafo)
- [ ] **Estados**: Proposed → Accepted / Deprecated / Superseded / Amended
- [ ] **Integración con `inscribe`**: anexar ADRs activos en ARCHITECTURE.md
- [ ] **Integración con `assay`**: las decisiones como insumo para el ensayo multi-persona
- [ ] **Cuándo escribir un ADR**: scoping, tecnología, patrón, estándar, cambio de regla, excepción
- [ ] **ADRs como fuente de verdad**: enlazar ADRs desde reglas de detect.mjs, desde inline ignores
- [ ] **Ejemplos**: ADRs reales del modelo Forge (ej. "usar capa Shared en vez de cross-feather imports", "adoptar Prisma como ORM")
- [ ] **Tooling**: script para crear, listar, cambiar estado de ADRs
- [ ] **Anti-patrones**: ADRs que nunca se leen, ADRs sin contexto, ADRs sin consecuencia, ADRs de frameworks

### Criterio de completitud

Un `forge inscribe` genera ARCHITECTURE.md con enlaces a ADRs activos. Un nuevo miembro del equipo puede entender las decisiones clave en 10 minutos.

---

## 04 — `anti-corruption-layer.md`

**Propósito:** Aislar sistemas legacy o externos sin contaminar el modelo de dominio de Forge.

**Depende de:** `bounded-contexts.md`
**Es usado por:** `relocate.md`, `reforge.md`, `cast.md`

### Secciones obligatorias

- [ ] **Definición y propósito ACL**: traducir entre modelos, evitar corrupción del modelo de dominio
- [ ] **Estructura de una ACL**: adapters de entrada (traducen del externo al dominio), adapters de salida (traducen del dominio al externo)
- [ ] **Strangler Fig pattern**: migración incremental con ACL como fachada
- [ ] **Implementación en el modelo de Forge**: la ACL vive en `adapter/out/` de una feature y traduce entre `infra/` y el modelo de dominio
- [ ] **Mapeo de integraciones legacy**: cómo modelar sistemas externos como bounded contexts con ACL
- [ ] **Estrategias de traducción**: event-based (publicar/suscribir), service-based (llamadas sincrónicas), repository-based (datos compartidos)
- [ ] **Conexión con reglas R1 y R7**: cómo ACL permite feature → infra sin violar la regla (porque el adapter traduce)
- [ ] **Detección automática**: qué patrones en detect.mjs indican necesidad de ACL
- [ ] **Ejemplo**: feature de "Orders" migrando de legacy SQL a nuevo schema con ACL + Strangler Fig
- [ ] **Anti-patrones**: ACL que filtra sin traducir (leaky abstraction), ACL que muta el origen, ACL como pasamanos

### Criterio de completitud

Un desarrollador puede identificar cuándo necesita una ACL, modelarla dentro del feature correspondiente, y ejecutar la migración con `relocate` sin romper el sistema existente.

---

## 05 — `evolutionary-architecture.md`

**Propósito:** Guiar la evolución continua de la arquitectura sin reescrituras, usando fitness functions.

**Depende de:** nada (fundacional)
**Es usado por:** `inspect.md`, `reforge.md`, `graph.md`, `quench.md`

### Secciones obligatorias

- [ ] **Definición**: arquitectura que evoluciona incrementalmente guiada por fitness functions
- [ ] **Fitness functions**: tests automatizados que validan características arquitectónicas (acoplamiento, modularidad, performance, seguridad)
- [ ] **Tipos de fitness functions**: estáticas (lint-level), dinámicas (runtime), periódicas (benchmark), trigger-based (CI)
- [ ] **Implementación en Forge**: las reglas R1-R9 como fitness functions gobernadas por detect.mjs
- [ ] **Fitness functions custom**: cómo el usuario define sus propias funciones y se registran en registry/rules.mjs
- [ ] **Guía de cambio incremental**: smallest viable change, refactor patterns, scaffolding antes de feature completo
- [ ] **Evolución de boundaries**: cómo partir, fusionar o mover features sin reescribir
- [ ] **Integración con CI/CD**: fitness functions en pipeline, gate de deployment, alertas de regresión
- [ ] **Ejemplo**: fitness function "no feature importa infra" evolucionando a "ningún módulo importa otro módulo sin interfaz"
- [ ] **Anti-patrones**: big-bang rewrite, frozen architecture, analysis paralysis, chasing tech debt sin métrica

### Criterio de completitud

Un equipo puede añadir fitness functions personalizadas, integrarlas en su pipeline, y medir la salud arquitectónica en cada PR sin intervención manual.

---

## 06 — `cqrs.md`

**Propósito:** Modelar separación de commands y queries dentro de features con demandas asimétricas.

**Depende de:** `bounded-contexts.md`
**Es usado por:** `data-patterns.md`, `events.md`, `sagas.md`, `cast.md`

### Secciones obligatorias

- [ ] **Fundamentos**: Command (escritura, efecto secundario, validación) vs Query (lectura, proyección, sin efectos)
- [ ] **Cuándo aplicar CQRS**: modelos de lectura/escritura divergentes, escalabilidad asimétrica, equipos separados, event sourcing
- [ ] **Implementación en el modelo de Forge**: command → use-case, query → repository o query service separado
- [ ] **Read models**: proyecciones desnormalizadas, tablas de lectura, caché de queries
- [ ] **CQRS parcial (sin event sourcing)**: commands y queries separados en la aplicación, misma BD
- [ ] **CQRS completo**: read model separado (tabla, BD, cache), eventual consistency
- [ ] **Materialized views / Projections**: cómo mantener read models actualizados
- [ ] **Separación de interfaces**: ICommandBus, IQueryBus como contratos en shared/
- [ ] **Conexión con reglas**: CQRS no viola ninguna regla de Forge porque commands y queries residen dentro del mismo feature
- [ ] **Anti-patrones**: CQRS everywhere (para CRUD simple), query leak (lógica de negocio en read model), eventual consistency ignorada
- [ ] **Ejemplo**: feature "Analytics" con CQRS parcial + read model en Redis via infra/redis

### Criterio de completitud

Un feature complejo con demands asimétricas puede modelarse con CQRS dentro de la estructura de Forge sin violar reglas y sin over-engineering.

---

## 07 — `sagas.md`

**Propósito:** Coordinar transacciones multi-feature sin violar la regla R8 (no acoplamiento directo entre features).

**Depende de:** `bounded-contexts.md`, `events.md`
**Es usado por:** `cast.md`, `reforge.md`, `events.md`

### Secciones obligatorias

- [ ] **Problema**: transacciones que cruzan bounded contexts sin ACID distribuido
- [ ] **Definición de Saga**: secuencia de transacciones locales con compensación
- [ ] **Coreografía (Choreography)**: cada participante publica/escucha eventos, decisión descentralizada
- [ ] **Orquestación (Orchestration)**: coordinador central que instruye a los participantes
- [ ] **Compensación**: transacciones reversibles, acciones compensatorias, consistencia eventual
- [ ] **Manejo de fallos**: retry con backoff, dead letter queue, fallback humano, saga log
- [ ] **Implementación en el modelo de Forge**: saga orchestrator como feature independiente (ej. "checkout-saga"), saga participantes usan eventos de dominio + adapters
- [ ] **Conexión con reglas R8 y R5**: cómo las sagas coordinan features sin importarlas directamente, eventos como contrato en shared/
- [ ] **Testing de sagas**: unit (participante individual), integration (flujo completo con mock), resilience (fallos y compensaciones)
- [ ] **Anti-patrones**: saga sin compensación (irreversible), orchestrator con lógica de negocio, coreografía sin trazabilidad, timeout único
- [ ] **Ejemplo**: saga de checkout (Inventory → Payment → Shipping) con orquestación y compensación por fallo de pago

### Criterio de completitud

Un desarrollador puede modelar un flujo multi-feature usando sagas sin violar R8, con compensaciones claras, testing cubierto y trazabilidad.

---

## 08 — `transactional-outbox.md`

**Propósito:** Garantizar entrega confiable de eventos sin exponer inconsistencias transaccionales.

**Depende de:** `events.md`
**Es usado por:** `sagas.md`, `cqrs.md`, `events.md`

### Secciones obligatorias

- [ ] **Problema**: dual-write (escribir en BD + publicar evento) atómico sin 2PC
- [ ] **Patrón Outbox**: escribir evento en tabla outbox dentro de la misma transacción que la operación de negocio
- [ ] **Outbox processor (relayer)**: proceso que lee la tabla outbox y publica eventos al message broker
- [ ] **Garantías**: at-least-once delivery, exactly-once processing con idempotencia
- [ ] **Implementaciones**: poll-based (relayer periódico), log-based (CDC con Debezium), hybrid
- [ ] **Integración con el modelo de Forge**: outbox en infra/prisma o infra/mongodb, processor como script/scheduler en platform/scheduler
- [ ] **Manejo de fallos**: retry con exponential backoff, poison messages, dead letter queue, alertas de outbox stuck
- [ ] **Idempotencia en consumidores**: deduplicación por event ID, idempotency key
- [ ] **Conexión con reglas**: outbox es infra que feature escribe mediante su adapter, sin violar R1
- [ ] **Anti-patrones**: outbox sin cleanup (tabla infinita), processor sin límite de reintentos, eventos sin idempotencia
- [ ] **Ejemplo**: feature "Orders" escribe pedido + outbox event en misma transacción Prisma → processor publica a RabbitMQ → "Payments" consume

### Criterio de completitud

Un feature que publica eventos puede implementar outbox pattern siguiendo el template de Forge, garantizando at-least-once delivery sin riesgo de inconsistencias.

---

## 09 — `idempotency.md`

**Propósito:** Garantizar operaciones seguras para retry en APIs, eventos y procesos asíncronos.

**Depende de:** `api-design.md`
**Es usado por:** `api-design.md`, `events.md`, `sagas.md`, `cast.md`

### Secciones obligatorias

- [ ] **Definición**: propiedad de una operación que puede aplicarse múltiples veces sin efecto secundario adicional
- [ ] **Tipos de idempotencia**: natural (GET), por clave (idempotency key), por semántica (last-write-wins)
- [ ] **Idempotency keys en APIs**: cabecera Idempotency-Key, almacenamiento en BD/cache, deduplicación, respuesta en caché
- [ ] **Idempotencia en eventos**: event ID como clave, deduplicación en consumidor, exactly-once semantics
- [ ] **Implementación en el modelo de Forge**: middleware en platform/http, repository en infra/redis, contract en shared/contracts
- [ ] **Idempotencia en sagas**: cómo cada paso de saga debe ser idempotente para retry seguro
- [ ] **Manejo de expiración**: TTL de claves de idempotencia, cleanup, conflictos de clave
- [ ] **Testing de idempotencia**: enviar misma request N veces, verificar resultado único
- [ ] **Conexión con reglas**: idempotency middleware es platform, repositorio de claves es infra, contracts son shared
- [ ] **Anti-patrones**: idempotency sin expiración, claves generadas por el servidor, idempotencia en GET, mutex como idempotencia
- [ ] **Ejemplo**: POST /payments con Idempotency-Key, key almacenada en Redis, respuesta en caché, consumidor de eventos con deduplicación

### Criterio de completitud

Cada API de mutación en el feature expone idempotency keys. Cada consumidor de eventos maneja deduplicación. Retry es seguro en toda la cadena.

---

## 10 — `api-versioning.md`

**Propósito:** Evolucionar contratos de API sin romper clientes existentes.

**Depende de:** `api-design.md`
**Es usado por:** `api-design.md`, `reforge.md`, `cast.md`

### Secciones obligatorias

- [ ] **Estrategias de versionado**: URL path (/v1/), header (Accept: application/vnd.api+json;version=1), content negotiation, query param
- [ ] **Compatibilidad**: backward compatible (additive changes), breaking changes (removal, rename, type change, required→optional) 
- [ ] **Evolución de OpenAPI**: spec versionada, changelog automático, diff entre versiones
- [ ] **Versionado en el modelo de Forge**: controllers versionados por feature (features/users/adapters/in/http/v1/, v2/), routes con prefijo
- [ ] **Deprecación**: cabeceras Sunset, Deprecation, Retirement policy, migración de clientes
- [ ] **Internal vs Public API**: versionado estricto para pública, semver para interna
- [ ] **Integration testing multi-versión**: tests que corren contra v1 y v2 simultáneamente
- [ ] **Conexión con reglas**: ningún controller versionado debe violar R0 (cero lógica de negocio). La lógica vive en use cases
- [ ] **Anti-patrones**: versionado por "fecha" sin estabilidad, mantener N versiones sin política de muerte, versionado de toda la API en vez de por endpoint
- [ ] **Ejemplo**: feature "Users" migrando de v1 a v2 con cambio de modelo, controllers separados, deprecación gradual

### Criterio de completitud

Un feature puede evolucionar su API de forma segura, con versionado explícito, deprecación controlada, tests multi-versión, y sin tocar la lógica de negocio.

---

## Integración en SKILL.md

- [x] Agregar las 10 referencias a la tabla **Module Index** en SKILL.md
- [x] Agregar entradas de **Command Routing** para los nuevos temas (lenguaje natural → referencia)
- [ ] Verificar que las referencias existentes que mencionan temas ahora cubiertos (events.md → sagas + outbox, data-patterns.md → CQRS) hagan `Ver: reference/<nueva>.md`

## Templates

- [x] Evaluar si `templates/feature/` necesita nuevos templates (saga orchestrator, outbox processor, ACL adapter, CQRS query service)
- [x] saga-orchestrator.ts.md — orchestrator con compensaciones
- [x] cqrs-query.ts.md — query service para lecturas separadas
- [x] acl-repository.ts.md — ACL que implementa repositorio de dominio
- [x] acl-translator.ts.md — traducción entre DTO externo y entidad de dominio
- [x] acl-gateway.ts.md — comunicación con sistema externo (HTTP)
- [x] outbox-repository.ts.md — repositorio de outbox integrado en UnitOfWork
- [x] outbox-relayer.ts.md — relayer en platform/scheduler
- [x] domain-event.ts.md — clase base DomainEvent con eventId para deduplicación
- [ ] Evaluar si `templates/shared/` necesita contratos de idempotencia o de eventos de integración

## Testing

- [x] transactional-outbox pattern — 5 tests (entry lifecycle, retry policy, DLQ, required fields, pending detection)
- [x] idempotency pattern — 5 tests (UUID validation, cached response, separate keys, TTL expiry, method filtering)
- [x] anti-corruption-layer pattern — 5 tests (external→domain mapping, domain→external mapping, null handling, 404 handling, delegation order)
- [ ] Prioridad futura: ADR workflow, evolutionary architecture fitness functions
