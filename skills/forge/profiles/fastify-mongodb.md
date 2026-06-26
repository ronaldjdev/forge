# Profile: Fastify + MongoDB + Mongoose

## Metadata

```yaml
framework: Fastify
runtime: Node 20+
database: MongoDB
orm: Mongoose
di_strategy: manual
architecture: hexagonal-feature
```

## DI Strategy

DI manual. Sin contenedor. Cableado en `app.ts`.

```typescript
// app.ts
import Fastify from "fastify";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URI);

const app = Fastify({ logger: true });
const creditRepo = new CreditRepository(mongoose.connection);
const addCredit = new AddCredit(creditRepo);
const creditController = new CreditController(addCredit);

app.register(creditRoutes(creditController));
await app.listen({ port: 3000 });
```

## Project Structure

```
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
│   │   ├── mongoose.ts          # Mongoose connection
│   │   └── models/              # Mongoose schemas
│   ├── app.ts
│   └── server.ts
```

## Persistence (Mongoose)

### Model schema

```typescript
// infrastructure/models/credit.model.ts
import { Schema, model } from "mongoose";

const creditSchema = new Schema({
  amount: { type: Number, required: true },
  userId: { type: String, required: true },
}, { timestamps: true });

export const CreditModel = model("Credit", creditSchema);
```

### Repository

```typescript
export class CreditRepository implements ICreditRepository {
  async create(data: CreditInput): Promise<Credit> {
    const doc = await CreditModel.create(data);
    return CreditMapper.toDomain(doc.toObject());
  }
}
```

## Routes & Controllers

Usar patrón Fastify plugin (ver `fastify-postgres`).

## Testing Strategy

```typescript
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
```

## Naming Conventions

Mismas que `express-mongodb`. Colecciones en snake_case, campos en camelCase.
