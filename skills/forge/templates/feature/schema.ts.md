```typescript
// src/features/<domain>/adapters/out/persistence/schemas/<Domain>.schema.ts
import { model, Schema } from "mongoose";
import type { <Domain> } from "../../../domain/entities/<Domain>.entity.js";

const <Domain>Schema = new Schema<<Domain>>(
  {
    // campos específicos
  },
  { timestamps: true }
);

<Domain>Schema.index({ /* índices */ });

// NOTA DI: model() exporta un objeto Model, NO una clase.
// En el contenedor DI usar container.register() con useValue, NO registerSingleton:
//   import <Domain>Model from "./<Domain>.schema.js";
//   container.register<I<Domain>Repository>("I<Domain>Repository", { useValue: <Domain>Model as any });
export default model<<Domain>>("<Domain>", <Domain>Schema);
```
