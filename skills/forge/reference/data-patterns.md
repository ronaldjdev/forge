# Data Patterns — Repository, Unit of Work, CQRS, Event Sourcing

## Repository Pattern

### Reglas

- La interfaz del repositorio está en `domain/` del feature.
- La implementación está en `adapters/out/persistence/`.
- El use case recibe la interfaz por constructor y nunca sabe qué BD hay detrás.

```ts
// domain/IUser.repository.ts
export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<UserEntity>;
  delete(id: string): Promise<void>;
}
```

```ts
// adapters/out/persistence/PostgresUser.repository.ts
export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}
  async findById(id: string) { … }
}
```

## Unit of Work

Para operaciones que requieren transacción entre múltiples repositorios.

```ts
// domain/IUnitOfWork.ts
export interface IUnitOfWork {
  withTransaction<T>(fn: (uow: { userRepo: IUserRepository; accountRepo: IAccountRepository }) => Promise<T>): Promise<T>;
}
```

## CQRS

Separar commands (escritura) de queries (lectura) solo cuando el modelo de lectura difiere significativamente del de escritura.

| Aspecto | Commands | Queries |
|---------|----------|---------|
| Feature dir | `application/use-cases/` | `application/queries/` |
| Retorno | `void` o ID | DTOs planos |
| Cache | No | Sí |
| Repositorio | Domain interface | Query interface separada |

## Event Sourcing

Para features que requieren auditoría completa o reconstrucción de estado histórico.

- Eventos en `domain/events/` dentro del feature
- Aggregate root: solo persiste eventos, nunca estado actual
- Proyecciones: tablas/materialized views que reflejan el estado actual
- Snapshotting cada N eventos para performance

### Estructura

```
features/<name>/
  domain/
    events/
      UserCreated.event.ts
      UserEmailChanged.event.ts
      UserDeleted.event.ts
```

## Cuándo usar cada patrón

| Patrón | Cuándo usarlo |
|--------|---------------|
| Repository | Siempre. Es el estándar para acceso a datos. |
| Unit of Work | Cuando una operación modifica 2+ agregados en una transacción. |
| CQRS | Cuando las queries de lectura son significativamente distintas a los comandos de escritura. |
| Event Sourcing | Solo cuando necesitas auditoría forense o reconstrucción de estado histórico. |

## Buenas prácticas

- Repositorios devuelven entidades de dominio, no schemas de BD
- Siempre hay un mapper entre schema de BD y entidad de dominio
- Transacciones en el Unit of Work, no en el use case ni en el repositorio individual
- CQRS no significa event sourcing; son patrones independientes
- Event sourcing sin snapshotting es inviable a escala
