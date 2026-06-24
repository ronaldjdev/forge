```typescript
// src/platform/database/Database.config.ts
import { loadEnvConfig } from "../config/Env.config.js";

export interface DatabaseConfig {
  url: string;
  maxRetries: number;
  retryDelay: number;
}

export function loadDatabaseConfig(): DatabaseConfig {
  const env = loadEnvConfig();
  return {
    url: env.databaseUrl,
    maxRetries: 3,
    retryDelay: 1000,
  };
}
```

```typescript
// src/platform/database/Connection.ts
import { loadDatabaseConfig } from "./Database.config.js";

let connection: unknown = null;

export async function connect(): Promise<void> {
  const config = loadDatabaseConfig();
  // conectar según ORM (prisma, mongoose, pg, etc.)
  console.log(`Connecting to database...`);
}

export async function disconnect(): Promise<void> {
  // desconectar
}

export function getConnection(): unknown {
  return connection;
}
```
