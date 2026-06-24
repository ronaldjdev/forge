```typescript
// src/platform/logger/Logger.config.ts

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerConfig {
  level: LogLevel;
  prettyPrint: boolean;
}

export function loadLoggerConfig(): LoggerConfig {
  return {
    level: (process.env.LOG_LEVEL as LogLevel) || "info",
    prettyPrint: process.env.NODE_ENV !== "production",
  };
}
```

```typescript
// src/platform/logger/Logger.service.ts
import { loadLoggerConfig, type LogLevel } from "./Logger.config.js";

const config = loadLoggerConfig();

export const logger = {
  debug: (msg: string, ...args: unknown[]) => log("debug", msg, ...args),
  info: (msg: string, ...args: unknown[]) => log("info", msg, ...args),
  warn: (msg: string, ...args: unknown[]) => log("warn", msg, ...args),
  error: (msg: string, ...args: unknown[]) => log("error", msg, ...args),
};

function log(level: LogLevel, msg: string, ...args: unknown[]): void {
  const levels: LogLevel[] = ["debug", "info", "warn", "error"];
  if (levels.indexOf(level) < levels.indexOf(config.level)) return;
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] [${level.toUpperCase()}] ${msg}`, ...args);
}
```
