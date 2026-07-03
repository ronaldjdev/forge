```typescript
// src/features/<domain>/di.ts
// DI container wiring para el feature <Domain>.
//
// NOTA: Si el repositorio exporta un modelo Mongoose (model()) en lugar de una clase,
// usar container.register() con useValue en vez de registerSingleton.
//
// Para entidades compartidas desde platform/domain/, usar path alias @/domain/ en vez de relativo.

import { container } from "tsyringe";
import type { I<Domain>Repository } from "./domain/repositories/I<Domain>.repository.js";
import { <Domain>Repository } from "./adapters/out/persistence/<Domain>.repository.js";
import { Create<Domain> } from "./application/use-cases/Create<Domain>.uc.js";
import { Get<Domain> } from "./application/use-cases/Get<Domain>.uc.js";
import { List<Domain> } from "./application/use-cases/List<Domain>.uc.js";
import { Update<Domain> } from "./application/use-cases/Update<Domain>.uc.js";
import { Delete<Domain> } from "./application/use-cases/Delete<Domain>.uc.js";

// ── Repositorio ──
// Si <Domain>Repository es una clase (implementación estándar):
container.registerSingleton<I<Domain>Repository>("I<Domain>Repository", <Domain>Repository);

// Si <Domain>Repository es un modelo Mongoose (export default model()), usar:
// import <Domain>Model from "./adapters/out/persistence/<Domain>.schema.js";
// container.register<I<Domain>Repository>("I<Domain>Repository", { useValue: <Domain>Model as any });

// ── Use Cases ──
container.registerSingleton(Create<Domain>);
container.registerSingleton(Get<Domain>);
container.registerSingleton(List<Domain>);
container.registerSingleton(Update<Domain>);
container.registerSingleton(Delete<Domain>);
```
