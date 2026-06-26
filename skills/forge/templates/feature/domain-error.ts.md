```typescript
// src/features/<domain>/domain/errors/<Domain>NotFound.error.ts
export class <Domain>NotFoundError extends Error {
  constructor(id: string) {
    super(`<Domain> with id ${id} not found`);
    this.name = "<Domain>NotFoundError";
  }
}
```
