```typescript
// src/features/<domain>/domain/events/<Domain>Created.event.ts
export class <Domain>CreatedEvent {
  constructor(
    public readonly <domain>Id: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```
