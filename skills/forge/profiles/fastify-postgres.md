# Profile: Fastify + PostgreSQL + Prisma

## Metadata

```yaml
framework: Fastify
runtime: Node 20+
database: PostgreSQL
orm: Prisma
di_strategy: manual
architecture: hexagonal-feature
```

## DI Strategy

DI manual. Sin contenedor de DI externo. Las dependencias se inyectan por constructor y se registran explícitamente en bootstrap.

```typescript
// app.ts
import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import { creditRoutes } from "@/features/credit/adapters/in/http/routes/credit.routes.js";

const app = Fastify({ logger: true });
const prisma = new PrismaClient();
const creditRepo = new CreditRepository(prisma);
const addCredit = new AddCredit(creditRepo);

app.register(creditRoutes(addCredit));

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

## Routes & Controllers

### Fastify plugin pattern

```typescript
// credit.routes.ts
import type { FastifyInstance } from "fastify";
import { CreditController } from "./CreditController.js";

export async function creditRoutes(app: FastifyInstance, controller: CreditController) {
  app.post("/credits", controller.add);
  app.get("/credits/:id", controller.getById);
  app.get("/credits", controller.list);
}
```

### Controller

```typescript
export class CreditController {
  constructor(private readonly addCredit: AddCredit) {}

  add = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.addCredit.execute(request.body as CreditInput);
    return reply.status(201).send({ data: result });
  };
}
```

## Persistence

Prisma repository pattern, identical to `express-prisma` profile.

## Testing Strategy

```typescript
import Fastify from "fastify";

const app = Fastify();
const mockRepo = { create: jest.fn() };
const useCase = new AddCredit(mockRepo);
const controller = new CreditController(useCase);

app.register(creditRoutes(controller));

afterAll(() => app.close());

it("creates a credit", async () => {
  mockRepo.create.mockResolvedValue({ id: "1" });
  const res = await app.inject({ method: "POST", url: "/credits", payload: { amount: 100 } });
  expect(res.statusCode).toBe(201);
});
```

## Naming Conventions

Mismas que express-profile profiles. Fastify usa camelCase para rutas.
