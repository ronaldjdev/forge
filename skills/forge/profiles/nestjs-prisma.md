# Profile: NestJS + Prisma

## Metadata

```yaml
framework: NestJS
runtime: Node 20+
database: Cualquier RDBMS
orm: Prisma
di_strategy: framework (NestJS DI)
architecture: hexagonal-feature
```

## DI Strategy

NestJS tiene su propio sistema de DI: `@Injectable()` decorator + módulos. No se necesita tsyringe.

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm"; // o Prisma

@Injectable()
export class AddCredit {
  constructor(private readonly creditRepo: ICreditRepository) {}
}
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
│   │       │   └── dto/
│   │       └── adapters/
│   │           ├── in/http/
│   │           │   ├── <Domain>Controller.ts
│   │           │   └── <domain>.module.ts
│   │           └── out/persistence/
│   │               ├── <Domain>Repository.ts
│   │               └── <Domain>PrismaRepository.ts
│   └── app.module.ts
```

## Module setup

### feature module

```typescript
// credit.module.ts
import { Module } from "@nestjs/common";
import { CreditController } from "./CreditController.js";
import { AddCredit } from "../../application/use-cases/Add.js";
import { CreditRepository } from "../out/persistence/CreditPrismaRepository.js";

@Module({
  controllers: [CreditController],
  providers: [
    AddCredit,
    { provide: "ICreditRepository", useClass: CreditRepository },
  ],
})
export class CreditModule {}
```

### Controller (NestJS style)

```typescript
import { Controller, Post, Get, Body, Param } from "@nestjs/common";
import { AddCredit } from "../../application/use-cases/Add.js";

@Controller("credits")
export class CreditController {
  constructor(private readonly addCredit: AddCredit) {}

  @Post()
  async create(@Body() data: CreditInput) {
    return this.addCredit.execute(data);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.addCredit.execute(id);
  }
}
```

## Persistence (Prisma)

NestJS con Prisma: crear un `PrismaModule` global y `PrismaService` que extiende `PrismaClient`.

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Repository

```typescript
@Injectable()
export class CreditRepository implements ICreditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Partial<Credit>): Promise<Credit> {
    const record = await this.prisma.credit.create({ data });
    return CreditMapper.toDomain(record);
  }
}
```

## Testing Strategy

```typescript
import { Test, TestingModule } from "@nestjs/testing";

const mockRepo = { create: jest.fn() };

beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AddCredit,
      { provide: "ICreditRepository", useValue: mockRepo },
    ],
  }).compile();

  useCase = module.get<AddCredit>(AddCredit);
});
```

## Naming Conventions

NestJS usa PascalCase para clases y camelCase para métodos/propiedades. Decoradores nativos `@Injectable()`, `@Controller()`, etc.

## Cross-feature communication

```typescript
// En NestJS, los módulos exportan providers para que otros módulos los usen
@Module({
  exports: [AddCredit], // Disponible para otros módulos
})
export class CreditModule {}
```
