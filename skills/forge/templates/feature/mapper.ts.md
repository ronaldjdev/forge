```typescript
// src/features/<domain>/application/mappers/<Domain>.mapper.ts
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
