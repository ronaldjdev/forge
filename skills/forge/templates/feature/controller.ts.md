```typescript
// src/features/<domain>/adapters/in/http/<Domain>Controller.ts
import { injectable, inject } from "tsyringe";
import type { Request, Response, NextFunction } from "express";
import { Create<Domain> } from "../../../application/use-cases/Create.js";
import { Get<Domain> } from "../../../application/use-cases/Get.js";
import { List<Domain> } from "../../../application/use-cases/List.js";
import { Update<Domain> } from "../../../application/use-cases/Update.js";
import { Delete<Domain> } from "../../../application/use-cases/Delete.js";

@injectable()
export class <Domain>Controller {
  constructor(
    @inject(Create<Domain>) private readonly create: Create<Domain>,
    @inject(Get<Domain>) private readonly get: Get<Domain>,
    @inject(List<Domain>) private readonly list: List<Domain>,
    @inject(Update<Domain>) private readonly update: Update<Domain>,
    @inject(Delete<Domain>) private readonly delete: Delete<Domain>
  ) {}

  createHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.create.execute(req.body);
      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.get.execute(req.params.id);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.list.execute(req.query);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.update.execute(req.params.id, req.body);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.delete.execute(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
```
