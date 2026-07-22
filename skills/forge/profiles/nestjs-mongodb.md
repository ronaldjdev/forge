# Profile: NestJS + MongoDB + Mongoose

## Metadata

```yaml
framework: NestJS
runtime: Node 20+
database: MongoDB
orm: Mongoose
di_strategy: framework (NestJS DI)
architecture: hexagonal-feature
```

## DI Strategy

NestJS DI nativo con `@Injectable()` y módulos. Conexión Mongoose via `MongooseModule.forRoot()`.

```typescript
// app.module.ts
@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    CreditModule,
  ],
})
export class AppModule {}
```

## Project Structure

```
├── src/
│   ├── features/
│   │   └── credit/
│   │       ├── domain/
│   │       │   ├── Credit.entity.ts        # Plain domain object
│   │       │   └── ICredit.repository.ts
│   │       ├── application/
│   │       │   └── use-cases/
│   │       │       └── AddCredit.uc.ts
│   │       └── adapters/
│   │           ├── in/http/
│   │           │   ├── Credit.controller.ts
│   │           │   └── Credit.module.ts
│   │           └── out/persistence/
│   │               ├── Credit.schema.ts     # Mongoose schema
│   │               └── Credit.repository.ts
│   ├── shared/
│   ├── app.module.ts
│   └── main.ts
```

## Persistence (Mongoose)

```typescript
// adapters/out/persistence/schemas/Credit.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class CreditDocument {
  @Prop({ required: true }) amount: number;
  @Prop({ required: true }) userId: string;
}

export const CreditSchema = SchemaFactory.createForClass(CreditDocument);
```

```typescript
// adapters/out/persistence/repositories/credit.module.ts
@Module({
  imports: [MongooseModule.forFeature([{ name: "Credit", schema: CreditSchema }])],
  providers: [{ provide: ICreditRepository, useClass: CreditRepository }],
  exports: [ICreditRepository],
})
export class CreditPersistenceModule {}
```

## Testing Strategy

```typescript
// Test con MongoMemoryServer
const module = await Test.createTestingModule({
  imports: [
    MongooseModule.forRoot(MongoMemoryServer.create().then(m => m.getUri())),
    CreditModule,
  ],
}).compile();
```

## Naming Conventions

Schemas en PascalCase, colecciones en snake_case (Mongoose usa plural automático).
