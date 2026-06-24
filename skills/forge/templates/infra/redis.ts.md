```typescript
// src/infra/redis/Redis.config.ts

export interface RedisConfig {
  url: string;
  prefix: string;
}

export function loadRedisConfig(): RedisConfig {
  return {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    prefix: process.env.REDIS_PREFIX || "app:",
  };
}
```

```typescript
// src/infra/redis/Redis.service.ts
import { loadRedisConfig } from "./Redis.config.js";

let client: unknown = null;

export async function connectRedis(): Promise<void> {
  // conectar según librería (ioredis, node-redis, etc.)
}

export async function disconnectRedis(): Promise<void> {
  // desconectar
}
```
