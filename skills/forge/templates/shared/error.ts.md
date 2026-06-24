```typescript
// src/shared/errors/NotFoundError.ts

export class NotFoundError extends Error {
  public readonly statusCode = 404;

  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}
```

```typescript
// src/shared/errors/ValidationError.ts

export class ValidationError extends Error {
  public readonly statusCode = 400;
  public readonly details: Record<string, string[]>;

  constructor(details: Record<string, string[]>) {
    super("Validation failed");
    this.name = "ValidationError";
    this.details = details;
  }
}
```
