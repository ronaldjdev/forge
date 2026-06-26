```typescript
// src/features/<domain>/adapters/out/events/<Domain>Created.handler.ts
import type { <Domain>CreatedEvent } from "../../domain/events/<Domain>Created.event.js";

export class <Domain>CreatedHandler {
  async handle(event: <Domain>CreatedEvent): Promise<void> {
    // Reaccionar al evento (ej: enviar email, notificar, auditar)
  }
}
```
