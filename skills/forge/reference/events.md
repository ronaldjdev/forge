# Events — Eventos de dominio, outbox, sagas

## Principios

- Los eventos representan **hechos consumados** en el dominio (pasado simple).
- Se emiten desde el use case después de persistir, nunca antes.
- El event bus es infraestructura (platform/events/); el dominio solo define la interfaz.
- Los handlers están en `adapters/` (out) del feature que reacciona al evento.

## Estructura

```
features/<name>/
  domain/
    events/
      UserCreated.event.ts
      UserEmailChanged.event.ts
```

## Evento de dominio

```ts
// features/users/domain/events/UserCreated.event.ts
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

## Emisión desde use case

```ts
// features/users/application/use-cases/CreateUser.uc.ts
export class CreateUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: CreateUserDTO): Promise<UserEntity> {
    const user = UserEntity.create(dto);
    const saved = await this.userRepo.save(user);
    this.eventBus.publish(new UserCreatedEvent(saved.id, saved.email));
    return saved;
  }
}
```

## Event Bus

```ts
// platform/events/EventBus.ts
export interface IEventBus {
  publish(event: object): void;
  subscribe<T>(eventType: new (...args: any[]) => T, handler: (event: T) => Promise<void>): void;
}
```

## Outbox Pattern

Para eventos que **deben** entregarse de forma confiable (ej: notificar a otro servicio).

1. El use case persiste el evento en una tabla `outbox` dentro de la misma transacción de BD.
2. Un worker independiente lee la outbox y publica los eventos al message broker.
3. Elimina o marca como enviado tras confirmación del broker.

```
features/<name>/adapters/out/persistence/
  ├── User.repository.ts
  └── Outbox.repository.ts
```

## Sagas / Process Managers

Para flujos multi-paso que abarcan múltiples features.

```ts
// features/orders/application/sagas/CreateOrder.saga.ts
// 1. OrderCreated → PaymentRequired
// 2. PaymentConfirmed → InventoryReserved
// 3. InventoryReserved → OrderConfirmed
// 4. Si falla: compensar (rollback) cada paso
```

## Buenas prácticas

- Eventos en pasado (`UserCreated`, `EmailChanged`), nunca (`CreateUser`, `ChangeEmail`)
- Un evento por handler. Si un handler falla, no bloquea otros.
- Idempotencia en handlers: processar el mismo evento dos veces produce el mismo resultado.
- Eventos sin lógica: son datos, no comportamiento.
- Para integración entre features: el feature A emite evento, el feature B lo escucha. Nunca import directo.
- Outbox para garantía de entrega; in-memory event bus solo para tests o monolitos pequeños.

## Ver también

- `reference/sagas.md` — coreografía, orquestación, compensaciones
- `reference/transactional-outbox.md` — entrega confiable de eventos, relayer, DLQ
- `reference/idempotency.md` — deduplicación y retry seguro en handlers
- `reference/cqrs.md` — command/query separation y proyecciones
- `reference/anti-corruption-layer.md` — traducción de eventos entre contexts
