```typescript
// src/features/<domain>/adapters/in/http/<domain>.routes.ts
import { Router } from "express";
import { container } from "tsyringe";
import { <Domain>Controller } from "./<Domain>Controller.js";

const router = Router();
const controller = container.resolve(<Domain>Controller);

router.post("/", controller.createHandler);
router.get("/:id", controller.getById);
router.get("/", controller.list);
router.patch("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;
```
