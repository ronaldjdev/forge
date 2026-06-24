```typescript
// src/infra/prisma/Prisma.client.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export { prisma };
```

```typescript
// src/infra/prisma/Prisma.service.ts
import { prisma } from "./Prisma.client.js";

export async function connectPrisma(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
```
