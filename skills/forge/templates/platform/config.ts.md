```typescript
// src/platform/config/App.config.ts

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
}

export function loadAppConfig(): AppConfig {
  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3000", 10),
    apiPrefix: process.env.API_PREFIX || "/api/v1",
  };
}
```

```typescript
// src/platform/config/Env.config.ts

export interface EnvConfig {
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
}

export function loadEnvConfig(): EnvConfig {
  return {
    databaseUrl: process.env.DATABASE_URL || "",
    redisUrl: process.env.REDIS_URL || "",
    jwtSecret: process.env.JWT_SECRET || "change-me",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  };
}
```
