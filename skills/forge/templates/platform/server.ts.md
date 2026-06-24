```typescript
// src/platform/server/App.ts
import "reflect-metadata";
import express from "express";
import { loadAppConfig } from "../config/App.config.js";

const app = express();
const config = loadAppConfig();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export { app, config };
```

```typescript
// src/platform/server/Server.ts
import { app, config } from "./App.js";

export async function startServer(): Promise<void> {
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}
```
