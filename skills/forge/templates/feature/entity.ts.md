```typescript
// src/features/<domain>/domain/<Domain>.entity.ts
import type { SomeGlobalType } from "@/shared/types/types.js";

export interface <Domain> {
  id: string;
  // propiedades específicas del dominio
  createdAt?: Date;
  updatedAt?: Date;
}
```
