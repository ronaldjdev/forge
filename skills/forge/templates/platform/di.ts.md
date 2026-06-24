```typescript
// src/platform/di/Tokens.ts

export const TOKENS = {
  Logger: Symbol("Logger"),
  Database: Symbol("Database"),
  Cache: Symbol("Cache"),
  EventBus: Symbol("EventBus"),
} as const;
```

```typescript
// src/platform/di/Container.ts
// Configuración del contenedor de DI según el perfil activo
// tsyringe: import { container } from "tsyringe";
// awilix: import { createContainer } from "awilix";
// manual: mantener un Map de registros
```
