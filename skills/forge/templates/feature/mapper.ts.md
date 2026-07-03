```typescript
// src/features/<domain>/application/mappers/<Domain>.mapper.ts
//
// IMPORTANTE: Si la entidad <Domain> está en platform/domain/entities/ (compartida),
// reemplazar el import relativo por path alias:
//   import type { <Domain> } from "@/domain/entities/<Domain>.js";

import type { <Domain> } from "../domain/entities/<Domain>.entity.js";

export class <Domain>Mapper {
  static toDomain(doc: Record<string, any>): <Domain> {
    return {
      ...doc,
    } as <Domain>;
  }

  static toPersistence(domain: <Domain>): Record<string, any> {
    return {
      ...domain,
    };
  }
}
```
