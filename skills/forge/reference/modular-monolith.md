# Modular Monolith

No todo proyecto necesita microservicios. El modular monolith es el punto óptimo para la mayoría de los equipos: la modularidad de features de Forge con la simplicidad operativa de un solo deploy.

---

## Espectro Monolith → Modular → Microservices

```
Monolith clásico          Modular Monolith              Microservicios
┌──────────────────┐    ┌──────────────────┐    ┌──┐ ┌──┐ ┌──┐ ┌──┐
│ Todo en una capa │    │ ┌─┐ ┌─┐ ┌─┐ ┌─┐│    │F1│ │F2│ │F3│ │F4│
│ Sin boundaries   │    │ │F1│ │F2│ │F3│ │F4││    └──┘ └──┘ └──┘ └──┘
│ BD compartida    │    │ └─┘ └─┘ └─┘ └─┘│    BD separadas
│ Sin features     │    │ Platform/Shared/Infra      │    APIs síncronas
└──────────────────┘    └──────────────────┘    │    Eventos asíncronos
                                                    │    Deploy independiente
                                                    └───────────────────────────
```

| Aspecto | Monolith clásico | Modular Monolith | Microservicios |
|---|---|---|---|
| **Boundaries** | No existen | Features con R8-R9 | Servicios independientes |
| **Comunicación** | Llamadas directas | Inyección de interfaces + eventos | HTTP/gRPC + eventos |
| **Deploy** | Todo junto | Todo junto | Independiente |
| **BD** | Compartida | Schemas separados por feature | BD independiente |
| **Equipo** | 1 equipo | 1-2 equipos | 3+ equipos |
| **Forge** | No aplica | Modelo nativo | Modelo nativo + split |
| **Escala** | < 20 features | < 40 features | Sin límite |

El modular monolith NO es un monolith clásico. La diferencia son los **boundaries explícitos**: cada feature respeta R8 (no imports directos) y R9 (no ciclos), igual que en microservicios, pero todo corre en el mismo proceso.

---

## Marco de Decisión

### Cuándo mantener Modular Monolith

| Condición | Señal |
|---|---|
| Equipo pequeño (< 8 personas) | Un solo equipo puede mantener todas las features |
| Dominio cohesionado | Los bounded contexts están estrechamente relacionados |
| Latencia crítica | El overhead de red de microservicios es inaceptable |
| Fase inicial | El dominio no está lo suficientemente entendido para partir |
| Baja carga operativa | Sin equipo de infraestructura dedicado |
| Deploy semanal/mensual | La velocidad de deploy no es el cuello de botella |

### Cuándo considerar partir a microservicios

| Señal | Síntoma |
|---|---|
| **Team scaling** | Dos equipos distintos modifican la misma feature frecuentemente |
| **Deployment bottleneck** | Un cambio en una feature requiere validar todo el monolith |
| **Boundaries maduros** | Los bounded contexts están estables y bien definidos |
| **Failure isolation** | Una feature con alta criticidad (ej. pagos) arrastra a las demás en fallos |
| **Diferentes características** | Una feature necesita escalar distinto (ej. Search vs Catalog) |
| **Stack divergence** | Una feature se beneficiaría de un stack tecnológico distinto |

### Contra-señales (no partir)

| Falsa señal | Realidad |
|---|---|
| "Es lo moderno" | Microservicios son una decisión de negocio, no técnica |
| "Escalabilidad" | El cuello de botella suele ser BD, no el monolith |
| "Equipos autónomos" | Sin boundaries bien definidos, los microservicios serán un distributed monolith |
| "Rendimiento" | El overhead de red puede empeorar la latencia |
| "Está de moda" | Moda tecnológica no justifica la complejidad operativa |

---

## Arquitectura Interna del Modular Monolith

### Comunicación entre features

En el modular monolith, la comunicación entre features sigue exactamente las mismas reglas que en microservicios:

```ts
// ✅ Permitido: inyección de interfaz desde shared
// src/features/orders/application/use-cases/PlaceOrderUseCase.ts
import { IInventoryService } from "src/shared/contracts/catalog";
import { IUnitOfWork } from "src/shared/contracts/data";

// ❌ Prohibido: import directo a otra feature (R8)
import { StockEntity } from "src/features/inventory/domain/StockEntity";

// ❌ Prohibido: import directo a infra de otra feature (R1 + R8)
import { prisma } from "src/features/inventory/adapters/out/persistence/repositories/prisma";
```

### Shared Kernel

```ts
// src/shared/contracts/catalog/IInventoryService.ts
export interface IInventoryService {
  reserveStock(orderId: string, items: LineItem[]): Promise<ReservationResult>;
  releaseStock(reservationId: string): Promise<void>;
}

// Los DTOs de los contratos viven junto a la interfaz
export type ReservationResult = {
  success: boolean;
  reservationId?: string;
  insufficientItems: { sku: string; available: number }[];
};
```

La implementación se inyecta en tiempo de construcción:

```ts
// src/features/inventory/adapters/out/shared/InventoryService.ts
export class InventoryServiceImpl implements IInventoryService {
  constructor(private readonly stockRepo: IStockRepository) {}
  // implementación real que la feature Inventory expone al Shared Kernel
}
```

### Base de datos

En el modular monolith, cada feature tiene su propio schema dentro de la misma BD:

```sql
-- Schema por feature, misma base de datos
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS inventory;

CREATE TABLE orders.orders ( … );
CREATE TABLE catalog.products ( … );
CREATE TABLE inventory.stock ( … );

-- No existen foreign keys entre schemas de distintas features
-- La integridad referencial se maneja en la aplicación, no en la BD
```

En Prisma esto se configura con `schema` por modelo:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["orders", "catalog", "inventory"]
}

model Order {
  id        String @id @default(uuid())
  // ...
  @@schema("orders")
}

model Product {
  id        String @id @default(uuid())
  // ...
  @@schema("catalog")
}
```

### Eventos dentro del monolith

Dentro del modular monolith, los eventos pueden ser sincrónicos (in-process event bus) o asíncronos (message broker):

```ts
// Sincrónico: EventBus in-process, sin serialización
// platform/events/EventBus.ts
export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(eventType: string, handler: (event: T) => Promise<void>): void;
}

// Uso en feature
// orders/application/use-cases/PlaceOrderUseCase.ts
await this.eventBus.publish(new OrderPlacedEvent(order));
// inventory/adapters/in/events/OrderPlacedHandler.ts
eventBus.subscribe("OrderPlaced", async (event) => {
  await this.stockService.reserveStock(event.orderId, event.items);
});
```

**Regla: dentro del monolith, puedes elegir síncrono o asíncrono.** Pero si planeas partir a microservicios en el futuro, usa asíncrono desde el día 1 (message broker). La migración será solo cambiar la URL del broker.

---

## Integración con Forge

| Elemento | Modular Monolith | Microservicios |
|---|---|---|
| **Reglas R1-R9** | Se aplican igual | Se aplican igual |
| **Contratos en shared/** | Interfaces + DTOs | Mismos contratos (packages publicados) |
| **Eventos** | In-process o broker | Broker siempre |
| **Platform** | Monolítica, compartida | Por servicio o shared library |
| **Infra** | Schemas separados en misma BD | BD independientes |
| **Deploy** | Un solo artefacto | N artefactos |
| **forge cast** | Crea feature en el monolith | Crea feature + esqueleto de servicio |
| **forge inspect** | Auditoría normal | Auditoría + health check distribuido |
| **forge relocate** | Extraer feature del monolith | Dividir servicio o fusionar |

### Transición guiada: Modular Monolith → Microservicios

```
Fase 1: Asegurar boundaries
  - Verificar que R8 y R9 se cumplen
  - shared/contracts/ debe contener todas las interfaces entre features
  - Schemas separados por feature

Fase 2: Extraer eventos
  - Migrar de event bus in-process a broker (RabbitMQ, Kafka)
  - Verificar que los handlers de eventos son idempotentes

Fase 3: Extraer feature como servicio
  1. forge relocate extrae la feature a un nuevo repo
  2. La feature origen ahora inyecta un cliente HTTP/gRPC en vez de la impl directa
  3. El contrato en shared/ se convierte en API contract
  4. Los eventos viajan por el broker existente

Fase 4: Iterar
  - Repetir Fase 3 para cada feature que se beneficie de partir
  - Dejar las demás en el monolith
```

---

## Anti-patrones

| Anti-patrón | Problema | Solución |
|---|---|---|
| **Distributed Monolith** | Microservicios que se llaman sincrónicamente en cadena. Si un servicio falla, todos fallan. | Usar eventos asíncronos entre servicios. Si la latencia lo exige sincrónico, reconsiderar si deberían ser un solo servicio. |
| **Shared Database (microservices)** | Microservicios que comparten BD. Los boundaries son ficticios. | Migrar a schemas separados o BD independientes. Empezar con schemas si el split es futuro. |
| **Nano-services** | Microservicio por entidad. Cada servicio es un CRUD sin lógica. | Fusionar en features por dominio de negocio. El overhead de operar N servicios pequeños es mayor que el beneficio. |
| **Premature splitting** | Partir antes de entender los bounded contexts. | Esperar a que los contexts estén estables. El monolith modular permite partir sin reescribir. |
| **Monolith con carpetas** | Solo hay separación por carpetas, no por boundaries. Cualquier código importa cualquier otro. | Implementar R8 y R9. Si duele, significa que los boundaries están mal diseñados o no existen. |

---

## Conexión con Forge

| Comando | Acción |
|---|---|
| `forge cast` | Crea feature en el monolith modular con boundaries correctos |
| `forge inspect` | Verifica que los boundaries entre features son saludables |
| `forge relocate` | Extrae una feature del monolith a un servicio independiente |
| `forge reforge` | Rediseña boundaries mal definidos dentro del monolith |
| `forge graph` | Visualiza dependencias entre features; identifica candidatos a partir |

## Ver también

- `reference/bounded-contexts.md` — contexts como módulos del monolith
- `reference/anti-corruption-layer.md` — ACL entre módulos
- `reference/sagas.md` — coordinación entre módulos
- `reference/events.md` — comunicación asíncrona entre módulos
