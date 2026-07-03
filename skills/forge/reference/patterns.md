# Patterns — Naming Conventions

## Global

| Elemento | Formato | Ejemplo |
|---|---|---|
| Directorios | `kebab-case/` | `credit-card/`, `event-bus/` |
| Archivos | `<PascalCase>.<artefacto>.ts` | `User.entity.ts` |
| Interfaces | `I<PascalCase>.<artefacto>.ts` | `IUser.repository.ts` |
| Use cases | `<Action>.uc.ts` | `CreateUser.uc.ts` |
| Clases | `PascalCase` | `UserController`, `DatabaseConfig` |
| Funciones/variables | `camelCase` | `formatDate`, `userService` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Tipos (type/interface puros) | `PascalCase` | `UserPayload`, `PaginatedResult` |
| Enums | `PascalCase` | `UserRole`, `OrderStatus` |
| Barrel files | `index.ts` | named exports, no `export default` |

---

## Platform Layer

| Directorio | Archivos |
|---|---|
| `config/` | `App.config.ts`, `Env.config.ts`, `Database.config.ts` |
| `server/` | `Server.ts`, `App.ts` |
| `database/` | `Database.config.ts`, `Connection.ts` |
| `http/` | `Router.ts`, `Auth.middleware.ts`, `Error.middleware.ts`, `RateLimiter.middleware.ts` |
| `logger/` | `Logger.config.ts`, `Logger.service.ts` |
| `cache/` | `Cache.config.ts`, `Cache.service.ts` |
| `security/` | `Auth.middleware.ts`, `Encryption.service.ts` |
| `events/` | `EventBus.ts`, `EventHandler.ts` |
| `scheduler/` | `Scheduler.config.ts`, `Scheduler.service.ts` |
| `observability/` | `Metrics.ts`, `Tracing.ts`, `Health.ts` |
| `di/` | `Container.ts`, `Tokens.ts`, `Module.ts` |

---

## Feature Layer

| Ruta | Archivo | Ejemplo |
|---|---|---|
| `domain/` | `<Name>.entity.ts` | `User.entity.ts` |
| `domain/` | `I<Name>.repository.ts` | `IUser.repository.ts` |
| `application/use-cases/` | `<Action>.uc.ts` | `CreateUser.uc.ts`, `GetUser.uc.ts` |
| `application/mappers/` | `<Name>.mapper.ts` | `User.mapper.ts` |
| `adapters/in/http/` | `<Name>.controller.ts` | `User.controller.ts` |
| `adapters/in/http/` | `<Name>.routes.ts` | `User.routes.ts` |
| `adapters/out/persistence/` | `<Name>.repository.ts` | `User.repository.ts` |
| `adapters/out/persistence/` | `<Name>.schema.ts` | `User.schema.ts` |

Estructura de directorios:

```
src/features/<feature-name>/
├── domain/
│   ├── <Domain>.entity.ts
│   └── I<Domain>.repository.ts
├── application/
│   ├── use-cases/
│   │   ├── Create<Domain>.uc.ts
│   │   ├── Get<Domain>.uc.ts
│   │   ├── List<Domain>.uc.ts
│   │   ├── Update<Domain>.uc.ts
│   │   └── Delete<Domain>.uc.ts
│   └── mappers/
│       └── <Domain>.mapper.ts
└── adapters/
    ├── in/http/
    │   ├── <Domain>.controller.ts
    │   └── <Domain>.routes.ts
    └── out/persistence/
        ├── <Domain>.repository.ts
        └── <Domain>.schema.ts
```

---

## Shared Layer

| Directorio | Archivos | Ejemplo |
|---|---|---|
| `errors/` | `<Name>Error.ts` | `NotFoundError.ts`, `ValidationError.ts` |
| `contracts/` | `I<Name>.ts` | `IPaginatedResponse.ts` |
| `types/` | `<dominio>.types.ts` | `user.types.ts`, `api.types.ts` |
| `utils/` | `<util>.ts` (camelCase) | `formatDate.ts`, `pagination.ts` |

---

## Events

| Archivo | Formato | Ejemplo |
|---------|---------|---------|
| Eventos de dominio | `<Domain><Accion>.event.ts` | `UserCreated.event.ts`, `OrderPaid.event.ts` |
| Handlers | `<Domain><Accion>.handler.ts` | `SendWelcomeEmail.handler.ts` |
| Outbox record | `<Entidad>.outbox.ts` | `User.outbox.ts` |

Los eventos siempre en pasado (`Created`, `Updated`, `Deleted`, `Paid`, `Shipped`), nunca en imperativo.

---

## Observability

| Archivo | Formato | Ejemplo |
|---------|---------|---------|
| Loggers | `Logger.service.ts`, `Logger.config.ts` | — |
| Métricas | `Metrics.ts`, `Metrics.middleware.ts` | — |
| Tracing | `Tracing.ts` | — |
| Health | `Health.ts`, `Health.controller.ts` | — |

Toda instrumentación vive en `platform/observability/`.
Para referencia completa ver `reference/observability.md`.

---

## Errors

| Archivo | Formato | Ejemplo |
|---------|---------|---------|
| Error base | `<Name>Error.ts` | `AppError.ts` |
| Error específico | `<Name>Error.ts` | `NotFoundError.ts`, `ValidationError.ts`, `ConflictError.ts` |

Los errores transversales viven en `shared/errors/`. Errores específicos de feature en `features/<name>/domain/errors/`.
Para guía completa ver `reference/errors.md`.

---

## API

| Archivo | Formato | Ejemplo |
|---------|---------|---------|
| Esquemas de validación | `<name>.schema.ts` | `createUser.schema.ts` |
| Routes | `<Name>.routes.ts` | `User.routes.ts` |
| Controller | `<Name>.controller.ts` | `User.controller.ts` |
| DTOs request | `<Name>.req.ts` | `CreateUser.req.ts` |
| DTOs response | `<Name>.res.ts` | `User.res.ts` |

REST prefiere `/api/v1/resources`. GraphQL schema en `adapters/in/graphql/` dentro del feature.

---

## Infra Layer

| Directorio | Archivos | Ejemplo |
|---|---|---|
| `prisma/` | `Prisma.client.ts`, `Prisma.service.ts` | — |
| `mongodb/` | `Mongo.config.ts`, `<Name>.model.ts` | `User.model.ts` |
| `redis/` | `Redis.config.ts`, `Redis.service.ts` | — |
| `mail/` | `Mail.config.ts`, `Mail.service.ts` | — |
| `s3/` | `S3.config.ts`, `S3.service.ts` | — |

---

## Import Conventions (OBLIGATORIO)

Todo import generado por Forge debe cumplir estas reglas. Violaciones = ERROR en forge quench:

### 1. Prefijo relativo obligatorio
Los imports locales SIEMPRE deben usar prefijo `./` o `../`. Prohibido el bare specifier:
```ts
// ✅ Correcto
import { X } from "./foo.js";
import { Y } from "../../bar.js";

// ❌ Incorrecto (bare specifier — se resuelve contra node_modules)
import { X } from "domain/entities/Task.js";
import { Y } from "domain/repositories/IRepo.js";
```

### 2. Extensión .js obligatoria
Con `moduleResolution: "nodenext"`, todos los imports locales requieren extensión `.js`:
```ts
// ✅ Correcto
import { X } from "./foo.js";

// ❌ Incorrecto
import { X } from "./foo.ts";
import { X } from "./foo";
```

### 3. Path alias para cross-layer
Usar path alias `@/` para cruzar capas, no paths relativos largos:
| Capa | Alias | Ejemplo |
|------|-------|---------|
| Platform → cualquiera | `@/platform/` | `@/platform/config/App.config.js` |
| Shared → cualquiera | `@/shared/` | `@/shared/errors/NotFoundError.js` |
| Infra → cualquiera | `@/infra/` | `@/infra/mongodb/Mongo.config.js` |
| **Entities compartidas** | **`@/domain/`** | **`@/domain/entities/Task.js`** |

```ts
// ✅ Correcto — path alias para entidad compartida
import { Task } from "@/domain/entities/Task.js";

// ❌ Incorrecto — path relativo largo que no resuelve
import { Task } from "../../../../domain/entities/Task.js";
```

### 4. Entity Discovery — compartida vs local
- Si la entidad vive en `src/features/<feature>/domain/entities/` → import relativo (`../../domain/entities/`)
- Si la entidad vive en `src/platform/domain/entities/` → path alias (`@/domain/entities/`)
- Verificar existencia ANTES de generar el import

### 5. Controllers y DI
- Controllers importan desde `./di.js` (feature con DI propia) o `@/setting/dependencies/<name>.di.js` (feature sin DI propia)
- Prohibido importar desde `bootstrap.di.js` — ese archivo no existe en la arquitectura actual

### 6. Tests
- Todos los imports con extensión `.js` (nunca `.ts`)
- Usar `as const` para literales de union types
- Usar `result!` para valores posiblemente null
- Usar `(result as any)._id` si `_id` no está en el tipo

## Export Conventions

- Cada directorio expone un `index.ts` barrel con named exports
- Usar `export * from "./<Name>.<artifact>.js"` en barrels
- Preferir `export function` / `export class` sobre `export default`
- Imports relativos dentro del mismo feature (`../../domain/`)
- Path alias para cross-layer: `@/platform/`, `@/shared/`, `@/infra/`, `@/domain/`
- Extension `.js` en imports (ESM compat): `import { X } from "./foo.js"`
