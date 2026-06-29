# Bounded Contexts — DDD Estratégico

Las features de Forge se corresponden con bounded contexts. Sin esta correspondencia, `src/features/<name>/` son solo directoríos con código agrupado por nombre, no unidades con integridad de dominio.

---

## Fundamentos de DDD Estratégico

### Dominio y Subdominios

El **dominio** es el área de actividad que el sistema modela. Se divide en tres tipos de **subdominio**:

| Tipo | Características | Ejemplo en e-commerce |
|---|---|---|
| **Core** | Ventaja competitiva, complejo, hecho en casa | Pricing engine, recomendaciones |
| **Supporting** | Necesario pero no diferenciador, puede externalizarse | Inventario, catálogo |
| **Generic** | Commodity, comprar o usar OSS | Auth, notificaciones, pagos |

Un **bounded context** es un límite explícito dentro del cual un modelo de dominio específico es consistente. Fuera del contexto, el mismo término puede tener significado distinto.

```ts
// En el contexto de "Catalog", Product tiene precio, descripción, imágenes
// En el contexto de "Inventory", Product tiene SKU, stock, warehouse location
// En el contexto de "Orders", Product tiene orderLine, quantity, status
// Son tres modelos distintos para el mismo concepto del mundo real
```

### Ubiquitous Language

Cada bounded context tiene su propio lenguaje ubicuo, compartido por el equipo de desarrollo y los expertos de negocio.

**Reglas del lenguaje ubicuo:**
- Los nombres de clases, métodos y módulos reflejan el lenguaje del negocio, no el lenguaje técnico
- No hay traducción entre "lo que el negocio dice" y "lo que el código llama"
- Si el negocio dice "Order" → la entidad se llama `OrderEntity`, no `OrderRecord` ni `OrderDoc`
- Si el negocio dice "cancelar pedido" → el caso de uso se llama `CancelOrderUseCase`, no `OrderDeleterService`
- Las discrepancias de lenguaje entre contexts son señales de límites válidos

**Conflicto de lenguaje como herramienta:** cuando dos personas del equipo usan la misma palabra con significado distinto (ej. "cliente" significa "usuario registrado" para marketing y "cuenta corporativa" para billing), hay dos bounded contexts esperando ser descubiertos.

---

## Context Mapping

Cada bounded context se relaciona con otros mediante relaciones explícitas. Estos son los 8 patrones del Context Mapping:

### Partnership

Dos contexts cooperan para entregar un flujo. Si uno falla, el otro también.

```
[Orders] ←→ [Inventory]
```

- Relación bidireccional
- Coordinación frecuente entre equipos
- Acoplamiento temporal tolerado
- Útil para flujos transaccionales críticos (checkout)

### Shared Kernel

Comparten un subconjunto pequeño y estable del modelo.

```
[Orders] ← kernel: Customer, Money → [Billing]
```

- El kernel compartido está en `src/shared/contracts/`
- Solo datos, no lógica de negocio
- El kernel se mantiene por acuerdo entre equipos
- Cambios requieren coordinación y tests
- Si crece demasiado, es señal de que los contexts deberían fusionarse

### Customer-Supplier

Un contexto upstream provee datos que el downstream consume. El upstream gana.

```
[CRM] → [Marketing]  (CRM dicta el contrato)
```

- Upstream (supplier) define el contrato
- Downstream (customer) se adapta
- El downstream debe implementar una ACL si el upstream no cubre sus necesidades
- Relación unidireccional

### Conformist

El downstream acepta el modelo del upstream sin cuestionarlo.

```
[SAP] → [Reporting]  (Reporting se adapta al modelo de SAP)
```

- Sin traducción: el downstream usa el modelo del upstream directamente
- Útil cuando el upstream es un sistema externo commodity
- Riesgo de corrupción del modelo de dominio downstream si el upstream cambia

### Anti-Corruption Layer (ACL)

El downstream protege su modelo con una capa de traducción.

```
[CRM Legacy] → [ACL] → [Orders]
```

- La ACL traduce del modelo legacy al modelo de dominio de Orders
- Ver `reference/anti-corruption-layer.md`
- Patrón obligatorio cuando se integra un sistema legacy o externo en un core domain

### Open-Host Service

El upstream expone un protocolo/shareable al que los downstreams se suscriben.

```
[Catalog] ── OHS (Published Language) ──→ [Search]
                                          ──→ [Recommendations]
                                          ──→ [Pricing]
```

- El upstream publica un Published Language (API, eventos, contratos compartidos)
- Múltiples downstreams consumen sin coordinar entre sí
- Es la relación ideal para la capa `adapter/out/` de una feature exponiendo eventos

### Published Language

El lenguaje compartido que el OHS usa. Puede ser:
- Contratos TypeScript en `src/shared/contracts/`
- Eventos de dominio con schema versionado
- OpenAPI spec como contrato HTTP
- Protobuf / Avro schemas

Los contratos publicados deben ser:
- Versionados (`src/shared/contracts/catalog/v1/`, `v2/`)
- Inmutables una vez publicados
- Documentados con ejemplos
- Validados con tests de compatibilidad

### Separate Ways

Dos contexts no tienen relación. Cada uno modela su solución independientemente.

```
[Notifications]   [Analytics]
(no se hablan)
```

- Válido cuando no hay solapamiento funcional
- Forzado por R8 (no imports directos entre features): por defecto, toda feature que no comparte contratos está en Separate Ways con las demás

---

## Identificación de Bounded Contexts

### Heurísticas prácticas

| Señal | Pregunta guía |
|---|---|
| **Equipo** | ¿Otro equipo podría ser dueño de esto? |
| **Lenguaje** | ¿Usan las mismas palabras con el mismo significado? |
| **Modelo** | ¿La misma entidad tiene atributos o comportamientos distintos? |
| **Frecuencia de cambio** | ¿Una parte del sistema cambia a ritmo distinto que otra? |
| **Base de datos** | ¿Podría tener su propio schema o base de datos? |
| **Deploy** | ¿Podría deployarse independientemente? |
| **Fallo** | ¿Un fallo aquí no debería afectar a otras partes? |

### Regla práctica de Forge

Si puedes nombrar un directorio `src/features/<name>/` y describir qué hace sin usar términos de otra feature, tienes un bounded context candidato.

Si necesitas decir "esto es parte de X pero usa el modelo de Y" o "comparte la BD con Z", el context mapping está mal definido.

---

## Mapeo Visual

Un diagrama de contextos muestra los bounded contexts como cajas y las relaciones como flechas etiquetadas.

```
┌──────────────────────────────────────────────────────┐
│                   E-Commerce System                    │
│                                                        │
│  ┌──────────┐  SK  ┌──────────┐  OHS    ┌──────────┐ │
│  │  Orders  │◄────►│ Catalog  ├────────►│  Search  │ │
│  └────┬─────┘      └──────────┘         └──────────┘ │
│       │                     │                         │
│       │PS                   │PL                        │
│       ▼                     ▼                          │
│  ┌──────────┐         ┌──────────┐                     │
│  │Inventory │         │  Pricing │                     │
│  └──────────┘         └──────────┘                     │
│       │                                                │
│       │CS                                               │
│       ▼                                                │
│  ┌──────────┐                                          │
│  │Shipping  │                                          │
│  └──────────┘                                          │
│                                                        │
│  ┌──────────┐  SW     ┌──────────┐                     │
│  │  Auth    │         │Analytics │                     │
│  └──────────┘         └──────────┘                     │
└────────────────────────────────────────────────────────┘

Leyenda:
  SK  = Shared Kernel
  OHS = Open-Host Service (vía Published Language)
  PS  = Partnership
  PL  = Published Language (unidirectional OHS)
  CS  = Customer-Supplier
  SW  = Separate Ways
```

---

## Relación con el Modelo de Forge

Cada `src/features/<name>/` mapea a (parte de) un bounded context.

| Regla | Relación con bounded contexts |
|---|---|
| **R8** (no cross-feature imports) | Enforces Separate Ways entre contexts. Si dos features necesitan comunicarse, debe ser vía Published Language (contratos en shared/) o Partnership (interfaces inyectadas). |
| **R9** (no ciclos) | Los ciclos entre contexts indican que el context mapping está mal: dos contexts que se necesitan mutuamente deberían fusionarse o introducir un tercer contexto mediador. |
| **R2** (platform → feature) | Platform es un contexto genérico que sirve a todos. No debe invertirse. |
| **R4** (shared → infra) | Shared kernel debe ser puro. Si shared necesita infra, el kernel está contaminado. |

### La feature como bounded context implementado

```
src/features/orders/
  domain/              ← Modelo del contexto Orders
    entities/
    events/
    repositories/      ← Puertos
  application/
    use-cases/         ← Flujos del contexto Orders
    mappers/           ← Traducción dentro del contexto
  adapters/
    in/http/           ← Entrada: Open-Host Service (API REST)
    out/persistence/   ← Salida: repositorio concreto
    out/events/        ← Salida: eventos publicados (Published Language)
```

---

## Anti-patrones

| Anti-patrón | Problema | Solución |
|---|---|---|
| **Contexto gigante (Orphan Core)** | Un solo contexto contiene todo el core domain. No hay límites. | Dividir por subdominio. Si duele partir, empezar por los flujos que cambian a ritmo distinto. |
| **Contexto fantasma** | Un bounded context declarado que no tiene modelo propio. Solo llama APIs de otros contexts. | Fusionar con el contexto que realmente tiene el modelo o eliminarlo. |
| **Contexto sin lenguaje** | El código usa nombres técnicos (UserService, DataManager, TransactionHelper). No hay rastro del lenguaje del negocio. | Hacer event storming con el equipo de negocio. Renombrar todo para reflejar el lenguaje ubícuo. |
| **Shared Kernel gigante** | Los contratos compartidos crecen sin control porque es más fácil poner algo en shared que diseñar el límite. | Forzar revisión en cada PR de shared/contracts/. Shared kernel debe ser minimalista y estable. |
| **Contexto anémico** | Un contexto que solo tiene CRUD y getters/setters. Sin reglas de negocio ni invariantes. | Preguntar: ¿qué reglas de negocio existen aquí? Si la respuesta es "ninguna", probablemente el contexto debería ser un subdominio genérico resuelto con infraestructura (CRUD framework). |

---

## Ejemplo Completo

Sistema de e-commerce con 4 bounded contexts:

**Catalog** (Supporting)
- Modelo: `Product`, `Category`, `Price`
- Lenguaje: producto, categoría, precio de lista, variante
- Persistencia: PostgreSQL
- Relaciones: OHS → Search (Published Language), CS → Pricing (provee precios base)

**Orders** (Core)
- Modelo: `Order`, `OrderLine`, `Payment`, `Shipment`
- Lenguaje: pedido, línea, pago, envío, cancelación, reembolso
- Persistencia: PostgreSQL (propio schema)
- Relaciones: Partnership ↔ Inventory, CS → Shipping, consume eventos de Catalog (Published Language)

**Inventory** (Supporting)
- Modelo: `Stock`, `Warehouse`, `Movement`
- Lenguaje: stock, almacén, entrada, salida, reserva
- Persistencia: PostgreSQL
- Relaciones: Partnership ↔ Orders, CS → Shipping (provee peso/volumen)

**Search** (Generic, con Elasticsearch)
- Modelo: `SearchableProduct` (read model desnormalizado de Catalog)
- Lenguaje: búsqueda, filtro, índice, relevancia
- Persistencia: Elasticsearch
- Relaciones: consume OHS de Catalog
- No tiene relaciones de salida: es puramente un contexto de lectura

```
Decisiones arquitectónicas reflejadas:
- Catalog y Search están separados porque tienen distinta frecuencia de cambio y stack
- Orders e Inventory en Partnership porque el checkout necesita coordinación transaccional
- Catalog como OHS permite que Search, Pricing y Recommendations consuman sin acoplar
- No hay ACL porque ningún legacy está involucrado (todos los contexts son nuevos)
```

---

## Conexión con Forge

| Comando | Acción |
|---|---|
| `forge cast` | Crea una nueva feature que se corresponde con un nuevo bounded context o subdomino |
| `forge inspect` | Detecta violaciones de límites entre contexts (R8, R9) |
| `forge graph` | Visualiza los bounded contexts y sus relaciones como grafo arquitectónico |
| `forge relocate` | Migra código entre contexts o extrae un contexto de un monolito legacy |
| `forge assay` | Evalúa cualitativamente la integridad de los límites entre contexts |

## Ver también

- `reference/modular-monolith.md` — contexto como unidad del monolith
- `reference/anti-corruption-layer.md` — protección de límites entre contexts
- `reference/cqrs.md` — separación command/query dentro de un context
- `reference/sagas.md` — coordinación entre contexts
