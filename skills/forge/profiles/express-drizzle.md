# Profile: Express + Drizzle ORM

## Metadata

```yaml
framework: Express
runtime: Node 20+
database: PostgreSQL / MySQL / SQLite
orm: Drizzle
di_strategy: manual
architecture: hexagonal-feature
```

## DI Strategy

DI manual. Sin contenedor externo. Las dependencias se inyectan por constructor y se cablean en `app.ts`.

```typescript
// app.ts
import express from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const creditRepo = new CreditRepository(db);
const addCredit = new AddCredit(creditRepo);
const creditController = new CreditController(addCredit);

app.use("/credits", creditRoutes(creditController));
app.listen(3000);
```

## Project Structure

```
├── src/
│   ├── db/
│   │   └── schema.ts          # Drizzle schema definitions
│   ├── features/
│   │   └── <domain>/
│   │       ├── domain/
│   │       ├── application/
│   │       └── adapters/
│   │           ├── in/http/
│   │           └── out/persistence/
│   ├── shared/
│   ├── app.ts
│   └── server.ts
```

## Persistence (Drizzle)

### Schema definition

```typescript
// src/db/schema.ts
import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const credits = pgTable("credits", {
  id: serial("id").primaryKey(),
  amount: integer("amount").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Repository

```typescript
import { eq } from "drizzle-orm";
import { credits } from "@/db/schema.js";

export class CreditRepository implements ICreditRepository {
  constructor(private readonly db: DrizzleClient) {}

  async create(data: CreditInput): Promise<Credit> {
    const [record] = await this.db.insert(credits).values(data).returning();
    return CreditMapper.toDomain(record);
  }

  async findById(id: number): Promise<Credit | null> {
    const [record] = await this.db.select().from(credits).where(eq(credits.id, id));
    return record ? CreditMapper.toDomain(record) : null;
  }
}
```

### Migrations

```bash
# Generate
npx drizzle-kit generate

# Apply
npx drizzle-kit migrate
```

## Testing Strategy

Unit: mocks de DrizzleClient. Integration: base de datos de test independiente.

## Naming Conventions

Las tablas en Drizzle siguen camelCase en el esquema, snake_case en PostgreSQL.
