# Profile: NestJS + PostgreSQL

## Metadata

```yaml
framework: NestJS
runtime: Node 20+
database: PostgreSQL
orm: TypeORM / native
di_strategy: framework (NestJS DI)
architecture: hexagonal-feature
```

## DI Strategy

NestJS DI nativo. Módulos con `@Module()`, `@Injectable()` para servicios y repositorios. Providers registrados en cada módulo de feature.

```typescript
// features/credit/credit.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([CreditEntity])],
  controllers: [CreditController],
  providers: [
    { provide: ICreditRepository, useClass: CreditRepository },
    AddCredit,
  ],
})
export class CreditModule {}
```

## Project Structure

```
├── src/
│   ├── features/
│   │   └── credit/
│   │       ├── domain/
│   │       │   ├── Credit.entity.ts       # TypeORM entity (dominio anémico aceptable)
│   │       │   └── ICredit.repository.ts
│   │       ├── application/
│   │       │   └── use-cases/
│   │       │       └── AddCredit.uc.ts
│   │       └── adapters/
│   │           ├── in/http/
│   │           │   ├── Credit.controller.ts
│   │           │   └── Credit.module.ts
│   │           └── out/persistence/
│   │               └── Credit.repository.ts
│   ├── shared/
│   ├── app.module.ts
│   └── main.ts
```

## Persistence (TypeORM)

```typescript
// domain/Credit.entity.ts
@Entity()
export class Credit {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() amount: number;
  @Column() userId: string;
  @CreateDateColumn() createdAt: Date;
}
```

```typescript
// adapters/out/persistence/Credit.repository.ts
@Injectable()
export class CreditRepository implements ICreditRepository {
  constructor(@InjectRepository(Credit) private readonly repo: Repository<Credit>) {}

  async create(data: CreditInput): Promise<Credit> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }
}
```

## Testing Strategy

```typescript
// Test unitario sin NestJS
const mockRepo = { create: jest.fn() };
const uc = new AddCredit(mockRepo);

// Test de integración con Test.createTestingModule
const module = await Test.createTestingModule({
  providers: [
    AddCredit,
    { provide: ICreditRepository, useClass: MockCreditRepo },
  ],
}).compile();
```

## Naming Conventions

Mismas que `nestjs-prisma`. Entidades TypeORM en PascalCase, tablas en snake_case con `@Entity("credit")`.
