# DI Strategies — Inyección de dependencias

## Principios

- Constructor injection sobre service locators o decoradores mágicos.
- El dominio nunca importa el contenedor. Solo application y adapters.
- Interfaces en domain/; implementaciones en adapters/out/ o platform/.
- **Cada feature es dueña de su registro DI** via `feature/di.ts`.

## Estrategias según tamaño del proyecto

| Tamaño | Estrategia | Cuándo usarla |
|--------|-----------|---------------|
| Pequeño (< 10 features) | DI Manual | Wires explícitos en composición root (src/app.ts) |
| Mediano (10-30 features) | Contenedor ligero | awilix, tsyringe, o el DI del framework |
| Grande (> 30 features) | Contenedor con módulos | NestJS modular, inversify con módulos lazy |

## DI Manual

```ts
// src/app.ts — Composition Root
import { PostgresUserRepository } from "./features/users/adapters/out/persistence/PostgresUser.repository.js";
import { CreateUserUseCase } from "./features/users/application/use-cases/CreateUser.uc.js";
import { UserController } from "./features/users/adapters/in/http/User.controller.js";

const userRepo = new PostgresUserRepository(db);
const createUserUc = new CreateUserUseCase(userRepo);
const userController = new UserController(createUserUc);

router.post("/users", (req, res) => userController.create(req, res));
```

## Contenedor (tsyringe) — Patrón feature/di.ts

Cada feature tiene un `di.ts` que es la **fuente única** de registro para ese feature.
`app.ts` importa esos archivos como side-effect:

```ts
// src/app.ts — Composition Root (solo imports)
import { container } from "tsyringe";
import "@/features/users/di.js";
import "@/features/credits/di.js";
// ...
```

```ts
// src/features/users/di.ts — Registro del feature (fuente única)
import { container } from "tsyringe";
import { IUserRepository } from "./domain/IUser.repository.js";
import { PostgresUserRepository } from "./adapters/out/persistence/PostgresUser.repository.js";

container.registerSingleton<IUserRepository>("IUserRepository", PostgresUserRepository);
```

**Regla clave**: Nunca registrar la misma dependencia en `app.ts` y `feature/di.ts`.
`app.ts` solo registra dependencias transversales (platform/shared).

## Buenas prácticas

- Composition Root único y lo más cercano al entrypoint posible
- Cada feature registra sus dependencias en su propio `di.ts`
- `app.ts` importa los `di.ts` — no registra features directamente
- Solo el Composition Root conoce todas las implementaciones concretas
- Preferir interfaces sobre clases abstractas en domain/
- Evitar `container.resolve()` fuera del Composition Root y routes
- Usar tokens (strings o símbolos) para identificar dependencias
- Testear use cases con mocks manuales sin necesidad del contenedor

## Ver también

- `reference/temper.md` — endurecimiento de DI (complemento directo)
- `reference/patterns.md` — naming y convenciones de contenedor DI
- `reference/testing-patterns.md` — mocks y DI testing
