# Profile: Fastify + Prisma

## Metadata

```yaml
framework: Fastify
runtime: Node 20+
database: Cualquier RDBMS (PostgreSQL, MySQL, SQLite)
orm: Prisma
di_strategy: manual
architecture: hexagonal-feature
```

## DI Strategy

DI manual. Sin contenedor externo. Cableado explícito en `app.ts`.

```typescript
// app.ts
import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";

const app = Fastify({ logger: true });
const prisma = new PrismaClient();
const creditRepo = new CreditRepository(prisma);
const addCredit = new AddCredit(creditRepo);
const creditController = new CreditController(addCredit);

app.register(creditRoutes(creditController));
await app.listen({ port: 3000 });
```

## Project Structure

```
├── prisma/
│   └── schema.prisma
├── src/
│   ├── features/
│   │   └── <domain>/
│   │       ├── domain/
│   │       ├── application/
│   │       └── adapters/
│   │           ├── in/http/
│   │           └── out/persistence/
│   ├── shared/
│   ├── infrastructure/
│   │   └── prisma.ts
│   ├── app.ts
│   └── server.ts
```

## Persistence

Idéntico al perfil `express-prisma`: repositorios Prisma con `PrismaClient` singleton, transacciones con `$transaction()`.

## Routes & Controllers

Usar el patrón Fastify plugin como en `fastify-postgres`. Cada feature expone un plugin que recibe el controlador por parámetro.

## Testing Strategy

```typescript
import Fastify from "fastify";

const app = Fastify();
const mockRepo = { create: vi.fn() };
const useCase = new AddCredit(mockRepo);

app.register(creditRoutes(new CreditController(useCase)));

it("creates a credit", async () => {
  mockRepo.create.mockResolvedValue({ id: "1" });
  const res = await app.inject({ method: "POST", url: "/credits", payload: { amount: 100 } });
  expect(res.statusCode).toBe(201);
});
```

## Naming Conventions

Mismas que `fastify-postgres`. Rutas en camelCase, servicios en PascalCase.
