# Idempotency — Operaciones Seguras para Retry

En sistemas distribuidos, las operaciones fallan. Los clientes reintentan. Sin idempotencia, un reintento puede crear facturas duplicadas, cargar dos veces la misma tarjeta o enviar un email dos veces. La idempotencia garantiza que N intentos producen el mismo resultado que uno.

---

## Definición

Una operación es **idempotente** si ejecutarla una o varias veces produce el mismo efecto secundario.

```ts
GET /orders/123       → idempotente (natural, no cambia estado)
PUT /orders/123       → idempotente (el mismo body produce el mismo estado final)
DELETE /orders/123    → idempotente (borrar algo ya borrado no cambia nada)
POST /orders          → NO es idempotente (crea un recurso nuevo cada vez)
PATCH /orders/123     → NO es idempotente por defecto (depende del delta)
```

Para hacer POST y PATCH idempotentes se necesita un **idempotency key**.

---

## Idempotency Keys en APIs

El cliente envía una clave única en el header `Idempotency-Key`. El servidor:
1. Si la clave es nueva: ejecuta la operación, guarda la respuesta, la retorna
2. Si la clave ya existe: retorna la respuesta guardada sin ejecutar la operación

### Implementación

```ts
// Platform middleware
// platform/http/middleware/IdempotencyMiddleware.ts
export class IdempotencyMiddleware {
  constructor(
    private readonly idempotencyRepo: IIdempotencyRepository,
    private readonly clock: IClock,
  ) {}

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Solo para métodos mutantes
    if (!["POST", "PATCH", "PUT"].includes(req.method)) return next();

    const key = req.headers["idempotency-key"] as string;
    if (!key) {
      // POST sin key es válido pero no tiene protección de idempotencia
      // Para operaciones críticas (pagos), debería ser obligatorio
      return next();
    }

    // Validar formato UUID
    if (!this.isValidUUID(key)) {
      return res.status(400).json({
        error: "Invalid idempotency key format. Must be a UUID v4.",
      });
    }

    const existing = await this.idempotencyRepo.find(key);
    if (existing) {
      // Clave ya usada → devolver respuesta en caché
      // Si la clave expiró, rechazar con 422
      if (existing.isExpired(this.clock)) {
        return res.status(422).json({
          error: "Idempotency key expired. Use a new key.",
        });
      }
      return res.status(existing.statusCode).json(existing.responseBody);
    }

    // Registrar clave antes de ejecutar (protege contra duplicados simultáneos)
    await this.idempotencyRepo.save(IdempotencyEntry.pending(key, req));

    // Ejecutar y guardar respuesta
    res.on("finish", async () => {
      await this.idempotencyRepo.save(
        IdempotencyEntry.completed(key, res.statusCode, res.body),
      );
    });

    next();
  }
}
```

### Repositorio de idempotencia

```ts
// infra/redis/IdempotencyRepository.ts
export class RedisIdempotencyRepository implements IIdempotencyRepository {
  private readonly TTL_SECONDS = 60 * 60 * 24; // 24 horas

  constructor(private readonly redis: Redis) {}

  async find(key: string): Promise<IdempotencyEntry | null> {
    const data = await this.redis.get(`idempotency:${key}`);
    if (!data) return null;
    return IdempotencyEntry.fromJSON(data);
  }

  async save(entry: IdempotencyEntry): Promise<void> {
    await this.redis.set(
      `idempotency:${entry.key}`,
      entry.toJSON(),
      "EX",
      this.TTL_SECONDS,
    );
  }
}
```

### Contract en shared/

```ts
// shared/contracts/http/IIdempotencyRepository.ts
export interface IIdempotencyRepository {
  find(key: string): Promise<IdempotencyEntry | null>;
  save(entry: IdempotencyEntry): Promise<void>;
}
```

### Reglas del Idempotency Key

1. **Generado por el cliente** (nunca por el servidor): el cliente necesita poder reintentar sin haber recibido respuesta
2. **Formato UUID v4**: único, no secuencial, sin colisiones
3. **TTL**: 24 horas típicamente. Si el cliente reintenta después del TTL, la clave expiró y debe generar una nueva
4. **Único por recurso/operación**: un mismo key no debe reusarse para operaciones distintas
5. **Protección de concurrencia**: dos requests simultáneos con el mismo key deben producir exactamente una ejecución (lock optimista en Redis)

---

## Idempotencia en Eventos

Los consumidores de eventos deben deduplicar por event ID para garantizar exactly-once processing.

```ts
// base consumer pattern
export abstract class IdempotentEventConsumer<T extends DomainEvent> {
  constructor(
    protected readonly processedEvents: IProcessedEventRepository,
  ) {}

  async handle(event: T): Promise<void> {
    // 1. Deduplicación
    const alreadyProcessed = await this.processedEvents.exists(event.eventId);
    if (alreadyProcessed) return;

    // 2. Ejecutar lógica de negocio
    await this.processEvent(event);

    // 3. Marcar como procesado (idealmente en la misma transacción)
    await this.processedEvents.markProcessed(event.eventId);
  }

  protected abstract processEvent(event: T): Promise<void>;
}
```

```ts
// Implementación concreta
export class OrderPlacedHandler extends IdempotentEventConsumer<OrderPlacedEvent> {
  constructor(
    processedEvents: IProcessedEventRepository,
    private readonly inventoryService: IInventoryService,
  ) {
    super(processedEvents);
  }

  protected async processEvent(event: OrderPlacedEvent): Promise<void> {
    await this.inventoryService.reserveStock(event.orderId, event.items);
  }
}
```

### Tabla de eventos procesados

```sql
CREATE TABLE IF NOT EXISTS public.processed_events (
  event_id      VARCHAR(255) PRIMARY KEY,
  consumer_name VARCHAR(255) NOT NULL,
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cleanup periódico: eventos procesados > 7 días
CREATE INDEX idx_processed_events_cleanup ON public.processed_events (processed_at);
```

---

## Idempotencia Natural por Operación

| Operación HTTP | Idempotencia natural | Cómo hacerla idempotente |
|---|---|---|
| **GET** | ✅ Sí | Nada. Es idempotente por definición. |
| **PUT** | ✅ Sí | Mismo body → mismo estado. |
| **DELETE** | ✅ Sí | Borrar algo ya borrado no cambia estado. |
| **POST** | ❌ No | Idempotency-Key header. |
| **PATCH** | ❌ No | Idempotency-Key header + operaciones basadas en estado (ej. "set status = X" es idempotente, "increment count" no lo es). |

### Operaciones condicionalmente idempotentes

```ts
// ❌ NO idempotente: el resultado cambia cada vez
PATCH /orders/123 { "action": "addItem", "productId": "abc" }

// ✅ Idempotente: el resultado es el mismo estado final
PUT /orders/123 { "items": ["abc", "def"] }

// ✅ Condicionalmente idempotente con idempotency key
POST /orders/123/items
Idempotency-Key: uuid-abc-123
Body: { "productId": "abc", "quantity": 1 }
```

---

## Implementación en el Modelo de Forge

### Estructura

```
src/platform/
  http/
    middleware/
      IdempotencyMiddleware.ts    ← middleware que intercepta requests
    contracts/
      IIdempotencyRepository.ts   ← interfaz en shared/

src/infra/
  redis/
    IdempotencyRepository.ts      ← implementación con Redis

src/features/<name>/
  adapters/
    in/
      events/
        <Name>Handler.ts          ← consumer con deduplicación
    out/
      persistence/
        ProcessedEventRepository.ts ← tabla processed_events
```

### Reglas de ubicación

| Componente | Capa | Razón |
|---|---|---|
| Middleware HTTP | platform/ | Es infraestructura transversal |
| Interfaz IIdempotencyRepository | shared/contracts/ | Contrato puro sin implementación |
| Implementación Redis | infra/ | Implementación concreta |
| IdempotencyKey generación | Cliente (frontend/CLI) | El cliente necesita la clave antes del request |
| Deduplicación en consumidores | feature/adapters/in/events/ | Específico del feature |

---

## Anti-patrones

| Anti-patrón | Problema | Solución |
|---|---|---|
| **Idempotency sin expiración** | Las claves se acumulan infinitamente. | TTL obligatorio (24h típico). Configurable por operación. |
| **Claves generadas por el servidor** | El servidor genera la key y la devuelve. Si la respuesta se pierde, el cliente no puede reintentar. | El cliente genera la key (UUID v4). El servidor solo la valida. |
| **Idempotencia en GET** | GET debe ser idempotente por definición. Si no lo es, el problema es otro (efectos secundarios en GET). | No añadir idempotency keys a GET. Mover efectos secundarios a POST/PUT. |
| **Mutex como idempotencia** | Bloquear el recurso en vez de deduplicar la operación. | Idempotencia no es locking. La clave permite deduplicar sin bloquear. |
| **Idempotency key corta** | Claves predecibles (incrementales, timestamp). Un cliente puede adivinar claves de otros. | UUID v4 obligatorio. No secuencial. No predecible. |
| **No verificar método** | El middleware aplica a GET también, añadiendo latencia innecesaria. | Solo POST, PATCH, PUT. GET pasa sin verificar. |

---

## Conexión con Forge

| Comando | Acción |
|---|---|
| `forge cast` | Incluir idempotency middleware + repo Redis en features críticas |
| `forge quench` | Regla detect: feature con POST sin idempotency key |
| `forge inspect` | Reporta endpoints sin protección de idempotencia |
| `forge api` | Verifica que los contratos OpenAPI incluyen idempotency-key header |
| `forge temper` | Endurece DI del middleware de idempotencia |

## Ver también

- `reference/transactional-outbox.md` — deduplicación en relayer
- `reference/api-design.md` — idempotency-key header en APIs
- `reference/events.md` — handlers idempotentes
- `reference/sagas.md` — retry seguro en sagas
