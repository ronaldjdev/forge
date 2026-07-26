# 02 — Modelo Arquitectónico

## Las 4 capas

Todo backend modelado por Forge se organiza en 4 dominios arquitectónicos:

```
src/
├── platform/        ← Backbone técnico global
│   ├── config/
│   ├── database/
│   ├── http/
│   ├── server/
│   ├── logger/
│   ├── cache/
│   ├── security/
│   ├── events/
│   ├── scheduler/
│   ├── observability/
│   └── di/
│
├── features/        ← Capacidades de negocio
│   ├── auth/
│   ├── users/
│   └── payments/
│
├── shared/          ← Componentes reutilizables puros
│   ├── errors/
│   ├── contracts/
│   ├── types/
│   └── utils/
│
└── infra/           ← Implementaciones concretas
    ├── prisma/
    ├── mongodb/
    ├── redis/
    └── mail/
```

| Layer | Propósito | Dueño | Ejemplos |
|-------|-----------|-------|----------|
| **Platform** | Backbone técnico global | Infra team | config, database, http, server, logger, cache, security, events, di |
| **Features** | Capacidades de negocio | Domain team | auth, users, payments, orders |
| **Shared** | Código puro reutilizable | Cualquiera | errors, contracts, types, utils |
| **Infrastructure** | Implementaciones concretas | Infra team | prisma, mongodb, redis, mail |

## Estructura de un Feature (Hexagonal)

Cada feature es un **vertical slice** con arquitectura hexagonal interna:

```
src/features/auth/
├── domain/
│   ├── entities/
│   │   └── User.entity.ts          ← Entidad de dominio
│   └── repositories/
│       └── IUser.repository.ts     ← Interfaz (puerto)
│
├── application/
│   ├── use-cases/
│   │   └── Login.uc.ts            ← Caso de uso
│   └── mappers/
│       └── User.mapper.ts          ← DTO ↔ Entity
│
└── adapters/
    ├── in/
    │   └── http/
    │       ├── controllers/
    │       │   └── Auth.controller.ts   ← Controller HTTP
    │       └── routes/
    │           └── auth.routes.ts       ← Rutas
    └── out/
        └── persistence/
            ├── repositories/
            │   └── PrismaAuth.repository.ts  ← Implementación
            └── schemas/
                └── User.schema.ts            ← Schema ORM
```

### Flujo de datos

```
HTTP Request
    │
    ▼
Controller (adapter/in)     ← Parsea request, llama use case
    │
    ▼
Use Case (application)      ← Lógica de negocio
    │
    ▼
Repository Interface (domain) ← Puerto abstracto
    │
    ▼
Repository Impl (adapter/out) ← Implementación concreta
    │
    ▼
Schema/ORM (infra)          ← Acceso a BD
```

## Convenciones de Naming

| Elemento | Formato | Ejemplo |
|----------|---------|---------|
| Directorios | `kebab-case/` | `credit-card/`, `event-bus/` |
| Archivos | `<PascalCase>.<artefacto>.ts` | `User.entity.ts` |
| Interfaces | `I<PascalCase>.<artefacto>.ts` | `IUser.repository.ts` |
| Use cases | `<Action>.uc.ts` | `CreateUser.uc.ts` |
| Clases | `PascalCase` | `UserController` |
| Funciones | `camelCase` | `formatDate` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |

## Platform Layer — Solo backbone técnico

Platform **nunca** contiene lógica de negocio:

```
src/platform/
├── config/         ← Variables de entorno, configuración centralizada
├── database/       ← Conexión a BD (no queries de negocio)
├── http/           ← Setup de express/fastify, middlewares
├── server/         ← Boot del servidor
├── logger/         ← Configuración de logging
├── cache/          ← Cliente Redis/Memcached
├── security/       ← Auth middleware, rate limiting
├── events/         ← Event bus local
├── scheduler/      ← Cron jobs, tareas programadas
├── observability/  ← Health checks, métricas, tracing
└── di/             ← Contenedor de dependencias global
```

Si un archivo en `platform/` tiene sufijos `.entity.ts`, `.uc.ts`, `.mapper.ts` o importa desde `features/`, está mal ubicado (violación R13).

## Shared Layer — Solo código puro

Shared contiene componentes reutilizables **sin dependencias de infraestructura ni negocio**:

```
src/shared/
├── errors/     ← Clases de error tipadas (AppError, NotFoundError)
├── contracts/  ← Interfaces compartidas entre features
├── types/      ← Tipos TypeScript genéricos
└── utils/      ← Funciones puras (formatDate, validateEmail)
```

Shared **nunca** importa de `features/`, `infra/` o `platform/`.
