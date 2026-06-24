```typescript
// src/features/<domain>/adapters/out/persistence/<Domain>Schema.ts
import { model, Schema } from "mongoose";
import type { <Domain> } from "../../../domain/<Domain>.entity.js";

const <Domain>Schema = new Schema<<Domain>>(
  {
    // campos específicos
  },
  { timestamps: true }
);

<Domain>Schema.index({ /* índices */ });

export default model<<Domain>>("<Domain>", <Domain>Schema);
```
