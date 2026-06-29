# CQRS — Command Query Responsibility Segregation

CQRS separa las operaciones de escritura (commands) de las de lectura (queries) en modelos distintos. No es un patrón para todo CRUD. Se aplica cuando la demanda de lectura es significativamente distinta a la de escritura.

---

## Fundamentos

### Command

- **Propósito**: cambiar el estado del sistema
- **Efectos**: side effects (escribir, publicar eventos, enviar emails)
- **Retorno**: void o ID del recurso creado
- **Validación**: reglas de negocio, invariantes, autorización
- **Modelo**: el modelo de dominio completo (entidades, aggregates, value objects)

```ts
// commands/PlaceOrder.command.ts
export class PlaceOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly items: { productId: string; quantity: number }[],
    public readonly paymentMethodId: string,
  ) {}
}
```

### Query

- **Propósito**: obtener datos sin modificar estado
- **Efectos**: ninguno (puro, idempotente)
- **Retorno**: DTOs planos, proyecciones desnormalizadas
- **Validación**: autorización, filtros
- **Modelo**: read model optimizado para consulta (puede diferir completamente del modelo de escritura)

```ts
// queries/GetOrderSummary.query.ts
export class GetOrderSummaryQuery {
  constructor(
    public readonly orderId: string,
    public readonly includeHistory?: boolean,
  ) {}
}

// DTO de retorno (read model)
export type OrderSummaryDTO = {
  orderId: string;
  status: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
  timeline: { status: string; at: string }[];
};
```

---

## Cuándo Aplicar CQRS

### Señales para aplicar CQRS

| Señal | Síntoma |
|---|---|
| **Modelo divergente** | La pantalla de detalle muestra datos agregados que no existen en el modelo de escritura |
| **Rendimiento asimétrico** | Las lecturas son 10x más frecuentes que las escrituras |
| **Optimización conflictiva** | Lo que optimiza escritura (normalización) empeora lectura (joins) |
| **Equipos separados** | El equipo que consume datos no es el mismo que los produce |
| **Múltiples representaciones** | Un mismo dato se muestra distinto en distintas pantallas |

### Cuándo NO aplicar CQRS

| Situación | Razón |
|---|---|
| CRUD simple sin lógica | Un repository con métodos find/findAll cubre |
| Modelo de lectura idéntico al de escritura | Separar añade complejidad sin beneficio |
| Feature pequeña (< 3 use cases) | La complejidad de CQRS supera el beneficio |
| Sin problemas de performance | CQRS no es un patrón de performance por defecto |

**Regla práctica:** si el use case de lectura es `findById` y devuelve exactamente la entidad, no necesitas CQRS. Si necesitas JOINs entre 5 tablas, cálculos agregados, y formato distinto al del modelo de escritura, CQRS ayuda.

---

## Implementación en el Modelo de Forge

### Estructura de directorios

```
src/features/analytics/
  domain/
    events/
      PageViewRecorded.event.ts
      ReportGenerated.event.ts
  application/
    use-cases/           ← Commands (escritura)
      RecordPageViewUseCase.ts
      GenerateReportUseCase.ts
    queries/             ← Queries (lectura separada)
      GetDashboardStatsQuery.ts
      GetUserActivityQuery.ts
    mappers/
      PageViewMapper.ts
  adapters/
    in/http/
      v1/
        commands/        ← Solo commands
          RecordPageViewController.ts
        queries/         ← Solo queries
          GetDashboardStatsController.ts
    out/
      persistence/       ← Repository de escritura
        PostgresPageViewRepository.ts
      read/              ← Read-only repository
        PostgresDashboardReadRepository.ts
        RedisDashboardReadRepository.ts
```

### CQRS Parcial (misma BD, modelos separados)

El caso más común: commands y queries separados en la aplicación, misma base de datos.

```ts
// Escritura: modelo de dominio completo
// domain/IPageViewRepository.ts
export interface IPageViewRepository {
  save(event: PageViewEntity): Promise<void>;
  findBySession(sessionId: string): Promise<PageViewEntity[]>;
}

// Lectura: read model desnormalizado
// application/queries/IDashboardReadRepository.ts
export interface IDashboardReadRepository {
  getActiveUsers(since: Date): Promise<number>;
  getTopPages(limit: number): Promise<{ path: string; views: number }[]>;
  getConversionRate(funnel: string[]): Promise<number>;
}

// Implementación de lectura (puede usar queries SQL directas)
// adapters/out/read/PostgresDashboardReadRepository.ts
export class PostgresDashboardReadRepository
  implements IDashboardReadRepository
{
  constructor(private readonly db: PrismaClient) {}

  async getActiveUsers(since: Date): Promise<number> {
    const result = await this.db.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT session_id) as count
      FROM analytics.page_views
      WHERE viewed_at >= ${since}
    `;
    return Number(result[0].count);
  }
}
```

### CQRS Completo (read model separado)

Cuando el modelo de lectura está en una BD o cache distinta:

```ts
// adapters/out/read/RedisDashboardReadRepository.ts
export class RedisDashboardReadRepository
  implements IDashboardReadRepository
{
  constructor(private readonly redis: Redis) {}

  async getActiveUsers(since: Date): Promise<number> {
    const cacheKey = `dashboard:active-users:${since.toISOString().slice(0, 13)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return Number(cached);

    // Si no está en cache, calcular (delegar a otro read repo)
    throw new Error("CacheMiss");
  }
}

// adapters/in/events/DashboardProjection.ts
// Escucha eventos de dominio y actualiza el read model
export class DashboardProjection {
  constructor(private readonly redis: Redis) {}

  async onPageViewRecorded(event: PageViewRecordedEvent): Promise<void> {
    // Invalidar cache de dashboard
    await this.redis.del(`dashboard:active-users:*`);
    // Incrementar contador de página
    await this.redis.hincrby("page:views", event.path, 1);
  }
}
```

### Proyecciones (Materialized Views)

Cuando el read model se actualiza desde eventos de dominio:

```ts
// La proyección escucha eventos y construye el read model
// adapters/in/events/OrderProjection.ts
export class OrderProjection {
  constructor(
    private readonly orderReadRepo: IOrderReadRepository,
    private readonly eventBus: IEventBus,
  ) {
    this.eventBus.subscribe("OrderPlaced", this.onOrderPlaced.bind(this));
    this.eventBus.subscribe("OrderShipped", this.onOrderShipped.bind(this));
  }

  async onOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    await this.orderReadRepo.upsert({
      orderId: event.orderId,
      status: "placed",
      total: event.total,
      itemCount: event.items.length,
      placedAt: event.occurredAt,
      timeline: [{ status: "placed", at: event.occurredAt }],
    });
  }

  async onOrderShipped(event: OrderShippedEvent): Promise<void> {
    await this.orderReadRepo.appendTimeline(
      event.orderId,
      { status: "shipped", at: event.occurredAt }
    );
    await this.orderReadRepo.updateStatus(event.orderId, "shipped");
  }
}
```

---

## Conexión con el Modelo de Forge

### Reglas y CQRS

| Regla | Aplicación en CQRS |
|---|---|
| **R0** (cero lógica en controllers) | Los controllers de queries y commands solo parsean y delegan. La lógica de query vive en `application/queries/`. |
| **R1** (feature → infra) | Los read repositories están en `adapters/out/read/`. Siguen siendo adapters, no violan R1. |
| **R5** (domain → infra) | El read model es un DTO, no una entidad de dominio. No viola R5 porque no hay entidad de dominio en la query. |
| **R8** (cross-feature) | Si una query necesita datos de otra feature, usa shared contracts o eventos, nunca import directo. |

### CQRS en templates de feature

```
src/features/<name>/
  application/
    use-cases/         ← commands (escritura)
    queries/           ← queries (lectura) — solo si aplica CQRS
    mappers/
  domain/
    entities/
    repositories/      ← interfaces de escritura
  adapters/
    out/
      persistence/     ← implementación de escritura
      read/            ← implementación de lectura — solo si aplica CQRS
```

Para features CRUD simples, no crear `queries/` ni `read/`. Usar el repository de dominio para todo.

---

## Anti-patrones

| Anti-patrón | Problema | Solución |
|---|---|---|
| **CQRS Everywhere** | Separar commands/queries en cada CRUD. El 80% de las features no lo necesita. | Aplicar solo cuando el modelo de lectura difiere significativamente del de escritura. |
| **Query leak** | Poner lógica de negocio en la query (calcular descuentos, validar reglas). | Las queries devuelven datos. Las reglas de negocio se evalúan en los commands. |
| **Eventual consistency ignorada** | El read model se actualiza con eventos; un comando escribe y la siguiente lectura no ve el cambio. | Documentar la consistencia eventual. No ocultarla. Si el negocio exige consistencia inmediata, no usar CQRS completo. |
| **Read model sin índices** | El read model replica el modelo normalizado de escritura. No hay beneficio. | El read model debe estar desnormalizado y optimizado para las consultas reales. |
| **Proyecciones frágiles** | Una proyección falla y el read model queda corrupto. | Rebuild de proyecciones (reprocesar eventos desde el principio) + monitoreo de lag. |

---

## Conexión con Forge

| Comando | Acción |
|---|---|
| `forge cast` | Durante el shape, decidir si la feature necesita CQRS |
| `forge inspect` | Reporta features con lecturas costosas que se beneficiarían de CQRS |
| `forge reforge` | Migra una feature de repository único a CQRS parcial/completo |
| `forge quench` | Verifica que las queries no violan reglas de dominio |

## Ver también

- `reference/bounded-contexts.md` — contexts donde CQRS aplica
- `reference/data-patterns.md` — repository, unit of work, event sourcing
- `reference/events.md` — eventos como fuente de proyecciones
- `reference/sagas.md` — sagas con CQRS
