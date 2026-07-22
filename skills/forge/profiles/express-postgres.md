# Profile: Express + PostgreSQL (raw)

## Metadata

```yaml
framework: Express
runtime: Node 20+
database: PostgreSQL
orm: node-postgres (pg)
di_strategy: manual
architecture: hexagonal-feature
```

## DI Strategy

Este perfil usa **DI manual** (sin tsyringe). Las dependencias se inyectan por constructor y se instancian manualmente en bootstrap.

```typescript
// app.ts — wiring manual
import { CreditRepository } from "@/features/credit/adapters/out/persistence/repositories/CreditRepository.js";
import { AddCredit } from "@/features/credit/application/use-cases/Add.js";
import { CreditController } from "@/features/credit/adapters/in/http/controllers/CreditController.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const creditRepo = new CreditRepository(pool);
const addCredit = new AddCredit(creditRepo);
const creditController = new CreditController(addCredit);
```

## Project Structure

```
├── src/
│   ├── features/
│   │   └── <domain>/
│   │       ├── domain/
│   │       │   ├── <Domain>.entity.ts
│   │       │   └── I<Domain>Repository.ts
│   │       ├── application/
│   │       │   ├── use-cases/
│   │       │   └── dto/
│   │       └── adapters/
│   │           ├── in/http/
│   │           └── out/persistence/
│   ├── shared/
│   ├── infrastructure/
│   │   └── pool.ts                # pg Pool singleton
│   └── server.ts
```

## Persistence (pg)

### Pool singleton

```typescript
// src/infrastructure/pool.ts
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

### Repository pattern

```typescript
export class CreditRepository implements ICreditRepository {
  constructor(private readonly db: Pool) {}

  async create(data: Partial<Credit>): Promise<Credit> {
    const { rows } = await this.db.query(
      `INSERT INTO credits (amount, status) VALUES ($1, $2) RETURNING *`,
      [data.amount, data.status]
    );
    return rows[0] as Credit;
  }

  async findById(id: string): Promise<Credit | null> {
    const { rows } = await this.db.query(
      `SELECT * FROM credits WHERE id = $1`,
      [id]
    );
    return rows[0] ? (rows[0] as Credit) : null;
  }
}
```

### Transactions

```typescript
export class CreateCredit {
  constructor(
    private readonly creditRepo: ICreditRepository,
    private readonly pool: Pool
  ) {}

  async execute(data: CreditInput): Promise<Credit> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const credit = await this.creditRepo.create(data, client);
      await client.query("COMMIT");
      return credit;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
```

## Controller pattern

```typescript
export class CreditController {
  constructor(private readonly addCredit: AddCredit) {}

  add = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.addCredit.execute(req.body);
      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  };
}
```

## Routes pattern

```typescript
import { Emitter } from "@adpt/adapters";

const router = Router();

export function setupCreditRoutes(controller: CreditController) {
  router.post("/", controller.add);
  router.get("/:id", controller.getById);
  return router;
}
```

## Testing Strategy

### Unit test

```typescript
const mockRepo = { create: jest.fn() };
const useCase = new AddCredit(mockRepo);
```

### Integration test

```typescript
import { Pool } from "pg";
const testPool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
```

## Naming Conventions

Tables in snake_case, columns in snake_case, JavaScript/TypeScript in camelCase.
