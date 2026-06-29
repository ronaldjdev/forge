```typescript
// src/features/<domain>/adapters/out/persistence/<Domain>OutboxRepository.ts
import { injectable } from "tsyringe";
import type { DomainEvent } from "../../../domain/events/DomainEvent.js";

export type OutboxEntry = {
  id: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  processedAt: Date | null;
  retryCount: number;
  lastError: string | null;
};

@injectable()
export class <Domain>OutboxRepository {
  async add(event: DomainEvent): Promise<void> {
    // Implementar: INSERT en tabla outbox dentro de la transacción actual
    // const entry: OutboxEntry = {
    //   id: crypto.randomUUID(),
    //   eventType: event.constructor.name,
    //   aggregateId: event.aggregateId,
    //   aggregateType: "<Domain>",
    //   payload: JSON.parse(JSON.stringify(event)),
    //   occurredAt: new Date(),
    //   processedAt: null,
    //   retryCount: 0,
    //   lastError: null,
    // };
    // await this.db.outbox.create({ data: entry });
  }
}
```
