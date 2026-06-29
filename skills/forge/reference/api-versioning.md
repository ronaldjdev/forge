# API Versioning — Evolución de Contratos

Las APIs evolucionan. Los clientes no siempre pueden actualizarse al mismo ritmo. El versionado de APIs permite cambiar contratos sin romper clientes existentes.

---

## Estrategias de Versionado

### URL Path (más común)

```
GET /api/v1/orders
GET /api/v2/orders
```

```ts
// features/orders/adapters/in/http/v1/OrderController.ts
@Router("/api/v1/orders")
export class OrderV1Controller {
  @Get("/:id")
  async getById(@Param("id") id: string) {
    return this.useCase.execute(new GetOrderQuery(id));
  }
}

// features/orders/adapters/in/http/v2/OrderController.ts
@Router("/api/v2/orders")
export class OrderV2Controller {
  @Get("/:id")
  async getById(@Param("id") id: string) {
    const result = await this.useCase.execute(new GetOrderQuery(id));
    // v2 devuelve datos adicionales que v1 no tenía
    return { ...result, estimatedDelivery: result.shippingEstimate };
  }
}
```

**Pros:** explícito, fácil de rutear, fácil de cachear
**Contras:** URLs feas, versionado de toda la API (no granular)

### Header (Accept / Content-Type)

```
GET /api/orders
Accept: application/vnd.company.v1+json
```

```ts
// Middleware que selecciona versión según Accept header
export class VersionResolver {
  resolve(req: Request): string {
    const accept = req.headers["accept"] || "";
    const match = accept.match(/application\/vnd\.company\.v(\d+)\+json/);
    return match ? `v${match[1]}` : "v1"; // default v1
  }
}
```

**Pros:** URLs limpias, versionado granular por endpoint
**Contras:** complejidad en el cliente, difícil de debuggear, caché HTTP limitada

### Query Parameter

```
GET /api/orders?version=2
```

**Pros:** simple, fácil de testear
**Contras:** contamina la semántica del query param, fácil de olvidar

### Content Negotiation (recurso vs representación)

```
GET /api/orders/123
Accept: application/json;version=2
```

**Pros:** semánticamente correcto (negociación de contenido)
**Contras:** complejidad, poco soporte tooling

### Recomendación de Forge

| Contexto | Estrategia |
|---|---|
| API pública (terceros) | URL path (`/api/v1/`) — la más explícita |
| API interna (entre features) | Header Accept — URLs limpias para el monolith |
| API móvil | URL path — los clientes móviles cachean URLs |
| BFF (Backend for Frontend) | Sin versionado (se despliega junto al frontend) |

---

## Compatibilidad

### Cambios backward-compatible

| Cambio | Ejemplo |
|---|---|
| Añadir campo opcional en response | `{ name, email }` → `{ name, email, phone? }` |
| Añadir endpoint nuevo | `GET /v1/orders/:id/items` |
| Añadir campo en request con default | `{ name }` → `{ name, locale?: "en" }` |
| Extender enum | `Status.Active` → `Status.Active \| Status.Pending` |
| Relajar validación | Campo required → opcional |

### Cambios breaking (requieren nueva versión)

| Cambio | Ejemplo |
|---|---|
| Eliminar campo del response | `{ name, email }` → `{ name }` |
| Renombrar campo | `{ email }` → `{ emailAddress }` |
| Cambiar tipo de campo | `{ price: string }` → `{ price: number }` |
| Hacer campo requerido | `{ locale? }` → `{ locale }` |
| Eliminar endpoint | `DELETE /v1/users` |
| Cambiar estructura | `{ address: string }` → `{ address: { street, city } }` |
| Cambiar error codes | `404` → `400` para mismo error |

### Compatibilidad en TypeScript

```ts
// shared/contracts/orders/v1/OrderDTO.ts
export interface OrderV1DTO {
  id: string;
  total: number;
  status: string;
  items: { sku: string; quantity: number }[];
}

// shared/contracts/orders/v2/OrderDTO.ts
export interface OrderV2DTO extends Omit<OrderV1DTO, "items"> {
  total: number;
  status: string;
  items: { sku: string; quantity: number; name: string; imageUrl: string }[];
  estimatedDelivery: string; // nuevo campo
}
```

---

## Versionado en el Modelo de Forge

### Estructura de directorios

```
src/features/orders/
  adapters/
    in/http/
      v1/
        OrderController.ts
        OrderRoutes.ts
        OrderValidator.ts    ← validación de input v1
        OrderPresenter.ts    ← formateo de output v1
      v2/
        OrderController.ts
        OrderRoutes.ts
        OrderValidator.ts
        OrderPresenter.ts
  application/
    use-cases/               ← los use cases NO se versionan
      GetOrderUseCase.ts     ← compartido entre v1 y v2
      PlaceOrderUseCase.ts
    mappers/                 ← los mappers pueden tener versiones
      v1/
        OrderMapper.ts       ← entidad de dominio → DTO v1
      v2/
        OrderMapper.ts       ← entidad de dominio → DTO v2
```

### Principio: la lógica de negocio no se versiona

```ts
// ✅ Los use cases son compartidos entre versiones
// v1 y v2 llaman al mismo use case
// Solo cambia el mapper (cómo se presenta el resultado)

// v1 mapper: devuelve el DTO original
export class OrderV1Mapper {
  toDTO(order: OrderEntity): OrderV1DTO {
    return {
      id: order.id,
      total: order.total,
      status: order.status,
      items: order.items.map((i) => ({ sku: i.sku, quantity: i.quantity })),
    };
  }
}

// v2 mapper: devuelve más información
export class OrderV2Mapper {
  toDTO(order: OrderEntity): OrderV2DTO {
    return {
      id: order.id,
      total: order.total,
      status: order.status,
      items: order.items.map((i) => ({
        sku: i.sku,
        quantity: i.quantity,
        name: i.productName,
        imageUrl: i.productImage,
      })),
      estimatedDelivery: this.calculateDelivery(order),
    };
  }
}
```

### Routing multi-versión

```ts
// platform/http/Router.ts
export class ApiRouter {
  constructor() {
    this.registerV1Routes();
    this.registerV2Routes();
    this.registerVersionRedirect();
  }

  private registerVersionRedirect(): void {
    // Si el cliente no especifica versión, redirigir a la más reciente estable
    this.router.get("/api/orders", (req, res) => {
      res.redirect("/api/v2/orders");
    });
  }
}
```

---

## Deprecación

### Política de deprecación

```
v1: lanzada 2025-01
v2: lanzada 2026-01  (v1 deprecated)
v3: lanzada 2027-01  (v1 sunset, v2 deprecated)
```

### Headers de deprecación

```ts
// Middleware que añade headers de deprecación a versiones antiguas
export class DeprecationMiddleware {
  private readonly sunsetVersions: Record<string, string> = {
    v1: "2027-01-01", // fecha de retiro
  };

  handle(req: Request, res: Response, next: NextFunction): void {
    const version = this.extractVersion(req.path);
    const sunsetDate = this.sunsetVersions[version];
    if (sunsetDate) {
      res.setHeader("Sunset", sunsetDate);
      res.setHeader("Deprecation", `true`);
      res.setHeader(
        "Link",
        `</api/v2${req.path.replace(/\/api\/v[0-9]/, "")}>; rel="successor-version"`,
      );
    }
    next();
  }
}
```

### Política de retiro

1. **Anunciar**: deprecación con 6 meses de anticipación (header `Deprecation: true` + `Sunset: fecha`)
2. **Migrar**: soporte simultáneo durante el período de transición
3. **Monitorear**: tracking de uso de versiones antiguas
4. **Retirar**: cuando el tráfico de la versión antigua es < 1%, retirar con PR visible

```bash
# Comando para monitorear uso de versiones
forge api --usage
# v1: 12% de requests
# v2: 88% de requests
# Sugerencia: v1 está lista para retiro (< 15%)
```

---

## Testing Multi-Versión

```ts
// tests/integration/orders/OrderApi.test.ts
describe("Orders API", () => {
  const versions = ["v1", "v2"];

  versions.forEach((version) => {
    describe(`${version} — getOrder`, () => {
      it("returns 200 for existing order", async () => {
        const response = await request(app)
          .get(`/api/${version}/orders/test-id`)
          .expect(200);

        if (version === "v1") {
          expect(response.body).not.toHaveProperty("estimatedDelivery");
        }
        if (version === "v2") {
          expect(response.body).toHaveProperty("estimatedDelivery");
        }
      });

      it("returns same core fields across versions", async () => {
        const [v1Res, v2Res] = await Promise.all([
          request(app).get("/api/v1/orders/test-id"),
          request(app).get("/api/v2/orders/test-id"),
        ]);

        expect(v1Res.body.id).toBe(v2Res.body.id);
        expect(v1Res.body.total).toBe(v2Res.body.total);
      });
    });
  });
});
```

### Compatibilidad backward en CI

```bash
# Verificar que v2 no rompe cambios backward
forge api --check-compatibility
# Checking orders v1 → v2... ✔ No breaking changes
# Checking users v1 → v2... ✖ Breaking: 'email' renamed to 'emailAddress'
#   → Crear ADR y plan de deprecación
```

---

## Anti-patrones

| Anti-patrón | Problema | Solución |
|---|---|---|
| **Versionado global** | Versionar `v1/`, `v2/` para toda la API. Un cambio mínimo en un endpoint fuerza nueva versión de toda la API. | Versionado por recurso/feature. No toda la API tiene que estar en la misma versión. |
| **Mantener versiones para siempre** | "No podemos romper al cliente X". La deuda de mantener N versiones crece. | Política de retiro explícita (Sunset header + fecha). Máximo 2 versiones activas simultáneas. |
| **Versionado por "fecha"** | `/api/2025-01/orders`. Sin semántica de estabilidad. | Usar `v1`, `v2` (semver simplificado: major version only). |
| **Lógica de negocio versionada** | El use case v2 es distinto del v1. La lógica se duplica. | Los use cases son compartidos. Solo versionar la presentación (mappers + controllers). |
| **Versionado sin deprecación** | Se lanza v2 pero v1 no se depreca oficialmente. Los clientes nunca migran. | Header Deprecation + Sunset. Comunicación proactiva a clientes. |
| **API versionada pero eventos no** | La API versiona contratos HTTP, pero los eventos internos cambian sin versión. | Versionar schemas de eventos también (ej. `OrderPlaced.v2`). |

---

## Conexión con Forge

| Comando | Acción |
|---|---|
| `forge cast payments` | Crea feature con estructura v1/ en adapters/in/http/ |
| `forge api --check-compatibility` | Verifica que los cambios no rompen versiones anteriores |
| `forge api --usage` | Muestra distribución de tráfico entre versiones |
| `forge reforge` | Migra controllers de v1 a v2, depreca la anterior |
| `forge inspect` | Reporta versiones sin Deprecation header cuando hay versión superior |

## Ver también

- `reference/api-design.md` — diseño de APIs REST/GraphQL
- `reference/adr.md` — ADRs para decisiones de versionado
- `reference/evolutionary-architecture.md` — evolución guiada de APIs
