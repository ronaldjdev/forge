# DI Strategies — Inyección de dependencias

## Principios

- Constructor injection sobre service locators o decoradores mágicos.
- El dominio nunca importa el contenedor. Solo application y adapters.
- Interfaces en domain/; implementaciones en adapters/out/ o platform/.

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

## Contenedor (tsyringe)

```ts
// di/Container.ts
import { container } from "tsyringe";
import { IUserRepository } from "@/features/users/domain/IUser.repository.js";
import { PostgresUserRepository } from "@/features/users/adapters/out/persistence/PostgresUser.repository.js";

container.registerSingleton<IUserRepository>("IUserRepository", PostgresUserRepository);
```

## Buenas prácticas

- Composition Root único y lo más cercano al entrypoint posible
- Solo el Composition Root conoce todas las implementaciones concretas
- Preferir interfaces sobre clases abstractas en domain/
- Evitar `container.resolve()` fuera del Composition Root
- Usar tokens (strings o símbolos) para identificar dependencias
- Testear use cases con mocks manuales sin necesidad del contenedor
