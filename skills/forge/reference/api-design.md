# API Design — Diseño de APIs REST/GraphQL

## Principios arquitectónicos

- Las rutas/endpoints pertenecen a `adapters/in/http/routes/`, nunca al dominio.
- El controller es la capa más delgada posible: parsea, delega, responde.
- La validación de entrada ocurre en el controller o middleware, no en domain/.
- El contrato API (OpenAPI/Swagger) se genera desde tipos compartidos.

## REST

### Convenciones

| Verbo | Ruta | Controller responde | Use case retorna |
|-------|------|-------------------|------------------|
| GET | `/resources` | 200 + array | `Resource[]` |
| GET | `/resources/:id` | 200 + object / 404 | `Resource \| null` |
| POST | `/resources` | 201 + object | `Resource` |
| PUT | `/resources/:id` | 200 + object | `Resource` |
| PATCH | `/resources/:id` | 200 + object | `Resource` |
| DELETE | `/resources/:id` | 204 / 404 | `void` |

### Paginación

```ts
// shared/contracts/IPaginatedResponse.ts
export interface IPaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

```ts
// Formato query: GET /users?page=1&limit=20&sort=name:asc&filter=status:active
```

### Versionado

- Preferir versionado por encabezado (`Accept: application/vnd.api+json;version=2`)
- Si es por URL: `/api/v1/resources` (carpeta física `adapters/in/http/controllers/v1/`)
- Deprecar con encabezado `Sunset: Sat, 01 Jan 2027 00:00:00 GMT`

## GraphQL

- Schema en `adapters/in/graphql/` dentro del feature
- Resolvers = use cases wrapped; nunca contienen lógica de negocio
- DataLoader para N+1 en resolvers de listas
- Scalar types custom para IDs, fechas, emails

## Buenas prácticas

- OpenAPI 3.1 como fuente de verdad para REST
- Validación con zod (compartir schemas entre controller y validación)
- Rate limiting por ruta/rol en middleware de platform/http/
- Errores normalizados: `{ error: { code, message, details? } }`
- Idempotencia en POST con `Idempotency-Key` header
- HATEOAS opcional, solo para APIs hipermedia

## Ver también

- `reference/api-versioning.md` — versionado de APIs y deprecación
- `reference/idempotency.md` — idempotency keys en POST
- `reference/security-patterns.md` — AuthN/AuthZ, rate limiting, validación
- `reference/testing-patterns.md` — tests de controllers y endpoints
