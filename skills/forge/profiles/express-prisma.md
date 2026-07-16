# Profile: Express + Prisma

## Metadata

```yaml
framework: Express
runtime: Node 20+
database: Cualquier RDBMS (PostgreSQL, MySQL, SQLite)
orm: Prisma
di_strategy: tsyringe
architecture: hexagonal-feature
```

## Project Structure

```
├── prisma/
│   └── schema.prisma
├── src/
│   ├── features/
│   │   └── <domain>/
│   │       ├── domain/
│   │       │   ├── <Domain>.entity.ts
│   │       │   └── I<Domain>Repository.ts
│   │       ├── application/
│   │       │   ├── use-cases/
│   │       │   ├── dto/
│   │       │   └── mappers/
│   │       └── adapters/
│   │           ├── in/http/
│   │           └── out/persistence/
│   ├── shared/
│   ├── infrastructure/
│   │   └── prisma.ts              # PrismaClient singleton
│   └── server.ts
```

## DI Setup

Igual que `express-mongodb` (tsyringe). Cada feature registra sus dependencias en `feature/di.ts`. `app.ts` importa esos archivos:

## Persistence (Prisma)

### PrismaClient singleton

```typescript
// src/infrastructure/prisma.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

### Repository pattern

```typescript
@injectable()
export class CreditRepository implements ICreditRepository {
  async create(data: Partial<Credit>): Promise<Credit> {
    const record = await prisma.credit.create({ data });
    return CreditMapper.toDomain(record);
  }

  async findById(id: string): Promise<Credit | null> {
    const record = await prisma.credit.findUnique({ where: { id } });
    return record ? CreditMapper.toDomain(record) : null;
  }
}
```

### Transactions

```typescript
@injectable()
export class CreateCredit {
  async execute(data: CreditInput): Promise<Credit> {
    return prisma.$transaction(async (tx) => {
      const credit = await tx.credit.create({ data });
      await tx.log.create({ data: { action: "credit_created", creditId: credit.id } });
      return credit;
    });
  }
}
```

## Testing Strategy

### Unit test

Misma estrategia que express-mongodb: `container.registerInstance()` con mocks.

### Integration test

```typescript
import { prisma } from "@/infrastructure/prisma.js";
import { CreditRepository } from "./CreditRepository.js";

beforeAll(async () => {
  // Prisma usa archivo de test o DB separada
  // process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
});

afterAll(async () => {
  await prisma.$disconnect();
});

it("persists a credit", async () => {
  const repo = new CreditRepository();
  const credit = await repo.create({ amount: 100 });
  expect(credit.id).toBeDefined();
  await prisma.credit.delete({ where: { id: credit.id } }); // cleanup
});
```

## Naming Conventions

Mismas que express-mongodb. Los nombres de tablas en Prisma siguen snake_case.
