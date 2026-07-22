```typescript
// src/features/<domain>/di.ts
// ── FUENTE ÚNICA de registro DI para el feature <Domain> ──
//
// Este archivo es la ÚNICA lugar donde se registran las dependencias de este feature.
// app.ts importa este archivo para que el contenedor conozca las implementaciones.
// NUNCA registrar las mismas dependencias en app.ts directamente.
//
// Reglas:
// - Si el repositorio exporta un modelo Mongoose (model()), usar container.register() con useValue.
// - Para entidades compartidas desde platform/domain/, usar path alias @/domain/.
// - No registrar dependencias de otros features aquí.

import { container } from "tsyringe";
import type { I<Domain>Repository } from "./domain/repositories/I<Domain>.repository.js";
import { <Domain>Repository } from "./adapters/out/persistence/repositories/<Domain>.repository.js";
import { Create<Domain> } from "./application/use-cases/Create<Domain>.uc.js";
import { Get<Domain> } from "./application/use-cases/Get<Domain>.uc.js";
import { List<Domain> } from "./application/use-cases/List<Domain>.uc.js";
import { Update<Domain> } from "./application/use-cases/Update<Domain>.uc.js";
import { Delete<Domain> } from "./application/use-cases/Delete<Domain>.uc.js";

// ── Repositorio ──
// Si <Domain>Repository es una clase (implementación estándar):
container.registerSingleton<I<Domain>Repository>("I<Domain>Repository", <Domain>Repository);

// Si <Domain>Repository es un modelo Mongoose (export default model()), usar:
// import <Domain>Model from "./adapters/out/persistence/schemas/<Domain>.schema.js";
// container.register<I<Domain>Repository>("I<Domain>Repository", { useValue: <Domain>Model as any });

// ── Use Cases ──
container.registerSingleton(Create<Domain>);
container.registerSingleton(Get<Domain>);
container.registerSingleton(List<Domain>);
container.registerSingleton(Update<Domain>);
container.registerSingleton(Delete<Domain>);
```
