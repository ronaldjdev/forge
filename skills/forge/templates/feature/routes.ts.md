```typescript
// src/features/<domain>/adapters/in/http/<Domain>.routes.ts
//
// IMPORTANTE: Los nombres de método del controller deben coincidir
// con los invocados aquí. Si el controller usa "add" en vez de "createHandler",
// ajustar la ruta: router.post("/", controller.add);

import { Router } from "express";
import { container } from "tsyringe";
import { <Domain>Controller } from "./<Domain>.controller.js";

const router = Router();
const controller = container.resolve(<Domain>Controller);

router.post("/", controller.createHandler);
router.get("/:id", controller.getById);
router.get("/", controller.list);
router.patch("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;
```
