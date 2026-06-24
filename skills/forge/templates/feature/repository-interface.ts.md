```typescript
// src/features/<domain>/domain/I<Domain>Repository.ts
import type { <Domain> } from "./<Domain>.entity.js";

export interface I<Domain>Repository {
  create(data: Partial<<Domain>>, session?: unknown): Promise<<Domain>>;
  findById(id: string, session?: unknown): Promise<<Domain> | null>;
  findAll(options?: Record<string, unknown>): Promise<{ data: <Domain>[]; total: number }>;
  update(id: string, data: Partial<<Domain>>, session?: unknown): Promise<<Domain> | null>;
  delete(id: string, session?: unknown): Promise<void>;
}
```
