```typescript
// src/platform/http/Router.ts
import { Router as ExpressRouter } from "express";

const router = ExpressRouter();

// registrar rutas globales (health, metrics, etc.)
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export { router };
```

```typescript
// src/platform/http/Error.middleware.ts
import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = (err as any).statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
}
```
