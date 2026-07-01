```typescript
// src/features/<domain>/application/use-cases/Create<Domain>.uc.ts
import { injectable, inject } from "tsyringe";
import type { <Domain> } from "../../domain/entities/<Domain>.entity.js";
import type { I<Domain>Repository } from "../../domain/repositories/I<Domain>.repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";
// Opcional: errores de dominio y eventos
// import { <Domain>NotFoundError } from "../../domain/errors/<Domain>NotFound.error.js";
// import type { IEventBus } from "@/platform/events/IEventBus.js";
// import { <Domain>CreatedEvent } from "../../domain/events/<Domain>Created.event.js";

@injectable()
export class Create<Domain> {
  constructor(
    @inject(I<Domain>Repository) private readonly repo: I<Domain>Repository,
    // @inject(IEventBus) private readonly eventBus: IEventBus,
  ) {}

  async execute(data: Partial<<Domain>>): Promise<<Domain>> {
    if (!data) throw new UseCaseError("Datos requeridos");
    const created = await this.repo.create(data);
    // Opcional: emitir evento de dominio
    // this.eventBus.publish(new <Domain>CreatedEvent(created.id));
    return created;
  }
}
```
