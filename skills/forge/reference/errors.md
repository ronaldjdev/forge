# Errors — Manejo de errores en arquitectura hexagonal

## Principios

- Los errores de dominio pertenecen al **dominio**, no al framework ni a HTTP.
- Los casos de uso lanzan errores de dominio; los adapters HTTP los traducen a respuestas HTTP.
- Nunca lanzar `throw new Error("...")` desde domain/application. Usar errores tipados.

## Estructura

```
src/shared/errors/
  ├── AppError.ts          → Clase base abstracta (opcional)
  ├── NotFoundError.ts     → 404
  ├── ValidationError.ts   → 400 / 422
  ├── UnauthorizedError.ts → 401
  ├── ForbiddenError.ts    → 403
  ├── ConflictError.ts     → 409
  └── DomainError.ts       → 500 genérico de dominio
```

## Ejemplo

```ts
// shared/errors/NotFoundError.ts
export class NotFoundError extends Error {
  constructor(public readonly entity: string, public readonly id: string) {
    super(`${entity} with id ${id} not found`);
    this.name = "NotFoundError";
  }
}
```

```ts
// features/users/domain/IUser.repository.ts
import { NotFoundError } from "@/shared/errors/NotFoundError.js";

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  // el use case decide si lanza NotFoundError
}
```

```ts
// features/users/adapters/in/http/User.controller.ts
import { NotFoundError } from "@/shared/errors/NotFoundError.js";

async getUser(req, res, next) {
  try {
    const user = await this.getUserUc.execute(req.params.id);
    res.json(user);
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    next(err);
  }
}
```

## Buenas prácticas

- Errores de dominio en `domain/` (o shared/errors si son transversales)
- `Result<T, E>` pattern para casos donde el error es parte del flujo esperado
- Error handler centralizado en platform/http/ para errores no capturados
- Loggear errores en el adapter, no en el dominio
- Códigos de error consistentes: `DOMAIN_ENTITY_NOT_FOUND`, `VALIDATION_INVALID_EMAIL`
