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

## Infra Layer

| Directorio | Archivos | Ejemplo |
|---|---|---|
| `prisma/` | `Prisma.client.ts`, `Prisma.service.ts` | — |
| `mongodb/` | `Mongo.config.ts`, `<Name>.model.ts` | `User.model.ts` |
| `redis/` | `Redis.config.ts`, `Redis.service.ts` | — |
| `mail/` | `Mail.config.ts`, `Mail.service.ts` | — |
| `s3/` | `S3.config.ts`, `S3.service.ts` | — |

---

## Export Conventions

- Cada directorio expone un `index.ts` barrel con named exports
- Usar `export * from "./<Name>.<artifact>.js"` en barrels
- Preferir `export function` / `export class` sobre `export default`
- Imports relativos dentro del mismo feature (`../../domain/`)
- Path alias para cross-layer: `@/platform/`, `@/shared/`, `@/infra/`
- Extension `.js` en imports (ESM compat): `import { X } from "./foo.js"`
