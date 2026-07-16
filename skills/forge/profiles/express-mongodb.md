# Profile: Express + MongoDB + Mongoose

## Metadata

```yaml
framework: Express
runtime: Node 20+
database: MongoDB
orm: Mongoose
di_strategy: tsyringe
architecture: hexagonal-feature
```

## Project Structure

```
├── src/
│   ├── features/
│   │   └── <domain>/
│   │       ├── domain/
│   │       │   ├── <Domain>.entity.ts          # Interfaz pura del dominio
│   │       │   └── I<Domain>Repository.ts      # Puerto de repositorio
│   │       ├── application/
│   │       │   ├── use-cases/
│   │       │   │   ├── Create.ts / Add.ts
│   │       │   │   ├── Get.ts / FindById.ts
│   │       │   │   ├── List.ts
│   │       │   │   ├── Update.ts
│   │       │   │   └── Delete.ts
│   │       │   ├── dto/                         # Data Transfer Objects
│   │       │   │   └── <Domain>DTO.ts
│   │       │   └── mappers/
│   │       │       └── <Domain>.mapper.ts       # Dominio ↔ Persistencia
│   │       └── adapters/
│   │           ├── in/http/
│   │           │   ├── <Domain>Controller.ts
│   │           │   └── <domain>.routes.ts
│   │           └── out/
│   │               └── persistence/
│   │                   ├── <Domain>Repository.ts
│   │                   └── <Domain>Schema.ts
│   ├── shared/
│   │   ├── errors/
│   │   ├── port/                   # Puertos globales (ILogger, IHttpClient, etc.)
│   │   └── utils/
│   ├── infrastructure/
│   │   └── db.ts                   # Conexión MongoDB
│   ├── adapters/out/               # Adapters transversales
│   │   ├── email/
│   │   ├── scheduler/
│   │   └── auth/
│   ├── setting/                    # Configuración global
│   ├── app.ts                      # Express app + DI container bootstrap
│   └── server.ts                   # Entry point
```

## DI Setup (tsyringe)

### Dependencies

```json
{
  "dependencies": {
    "tsyringe": "^4.8.0",
    "reflect-metadata": "^0.2.2"
  }
}
```

### tsconfig

```jsonc
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Entry point (server.ts)

```typescript
import "reflect-metadata"; // Antes que cualquier otro import
import { createApp } from "./app.js";
// ...
```

### Container registration (app.ts)

```typescript
import { container } from "tsyringe";

// Importar los di.ts de cada feature — cada uno registra sus propias dependencias.
// NUNCA registrar las mismas dependencias aquí directamente.
import "@/features/credit/di.js";
// import "@/features/users/di.js";  // más features...

// Solo registrar dependencias transversales (platform/shared) aquí:
// container.registerSingleton<ILogger>("ILogger", WinstonLogger);
```

## DI Rules

- `@injectable()` en toda clase con dependencias (use cases, controllers, repositories)
- `@inject(Token)` con tokens de clase, nunca strings
- Cada feature registra sus dependencias en `feature/di.ts` (fuente única)
- `app.ts` importa los `di.ts` de cada feature — no registra features directamente
- `container.resolve()` solo en routes (para resolver controllers)
- Prohibido `container.resolve()` en use cases, entities o adapters
- Prohibido `new UseCase(dep1, dep2)` en features migrados a DI
- Prohibido registrar la misma dependencia en `app.ts` y `feature/di.ts`

## Routes & Controllers

### Controller pattern

```typescript
@injectable()
export class CreditController {
  constructor(
    @inject(AddCredit) private readonly addCredit: AddCredit,
    @inject(GetCredit) private readonly getCredit: GetCredit,
  ) {}

  add = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const result = await this.addCredit.execute(data);
      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  };
}
```

### Routes pattern

```typescript
import { Router } from "express";
import { container } from "tsyringe";
import { CreditController } from "./CreditController.js";

const router = Router();
const controller = container.resolve(CreditController);

router.post("/", controller.add);
router.get("/:id", controller.getById);

export default router;
```

## Persistence (Mongoose)

### Schema pattern

```typescript
import { model, Schema } from "mongoose";
import type { Credit } from "../../../domain/Credit.entity.js";

const creditSchema = new Schema<Credit>(
  { /* fields */ },
  { timestamps: true }
);

export default model<Credit>("Credit", creditSchema);
```

### Repository pattern

```typescript
@injectable()
export class CreditRepository implements ICreditRepository {
  async create(data: Partial<Credit>): Promise<Credit> {
    const doc = await CreditModel.create(data);
    return CreditMapper.toDomain(doc.toObject());
  }

  async findById(id: string): Promise<Credit | null> {
    const doc = await CreditModel.findById(id).lean();
    return doc ? CreditMapper.toDomain(doc) : null;
  }
}
```

### Transactions

```typescript
import { ClientSession } from "mongoose";

@injectable()
export class CreditRepository implements ICreditRepository {
  async create(data: Partial<Credit>, session?: ClientSession): Promise<Credit> {
    const doc = session
      ? (await CreditModel.create([data], { session }))[0]
      : await CreditModel.create(data);
    return CreditMapper.toDomain(doc.toObject());
  }
}
```

Usar transacciones desde el use case:

```typescript
import mongoose from "mongoose";

@injectable()
export class CreateCredit {
  async execute(data: CreditInput): Promise<Credit> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const credit = await this.creditRepo.create(data, session);
      await session.commitTransaction();
      return credit;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
```

## Testing Strategy

### Unit test (use case)

```typescript
import "reflect-metadata";
import { container } from "tsyringe";
import { ICreditRepository } from "@/features/credit/domain/ICreditRepository.js";

const mockRepo = { create: jest.fn() };

beforeEach(() => {
  container.registerInstance(ICreditRepository as symbol, mockRepo);
});

afterEach(() => {
  container.clearInstances();
});

it("creates a credit", async () => {
  mockRepo.create.mockResolvedValue({ id: "1" });
  const useCase = container.resolve(AddCredit);
  const result = await useCase.execute({ amount: 100 });
  expect(result.id).toBe("1");
});
```

### Integration test (repository)

```typescript
import mongoose from "mongoose";
import { CreditRepository } from "./CreditRepository.js";

beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__);
});

afterAll(async () => {
  await mongoose.disconnect();
});

it("persists a credit", async () => {
  const repo = new CreditRepository();
  const credit = await repo.create({ amount: 100 });
  expect(credit.id).toBeDefined();
});
```

## Naming Conventions

| Elemento | Convención | Ejemplo |
|---|---|---|
| Entidad (archivo) | `<Domain>.entity.ts` | `Credit.entity.ts` |
| Interfaz repositorio | `I<Domain>Repository.ts` | `ICreditRepository.ts` |
| Use case (archivo) | `Create.ts`, `Get.ts`, etc. | `Create.ts` |
| Controller | `<Domain>Controller.ts` | `CreditController.ts` |
| Routes | `<domain>.routes.ts` | `credit.routes.ts` |
| Schema | `<Domain>Schema.ts` | `CreditSchema.ts` |
| Repository impl | `<Domain>Repository.ts` | `CreditRepository.ts` |
| Mapper | `<Domain>.mapper.ts` | `Credit.mapper.ts` |
| DTO | `<Domain>DTO.ts` | `CreditDTO.ts` |

## Imports

- Usar `@/` alias para imports absolutos (mapeado a `src/`)
- Extensión `.js` en imports locales (ESM)
- En imports dentro del mismo feature, usar rutas relativas: `../../domain/X.entity.js`
- Para imports entre features, inyectar la interfaz, nunca importar directamente
