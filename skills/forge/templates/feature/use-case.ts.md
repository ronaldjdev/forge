```typescript
// src/features/<domain>/application/use-cases/Create.ts
import { injectable, inject } from "tsyringe";
import type { <Domain> } from "../../domain/<Domain>.entity.js";
import type { I<Domain>Repository } from "../../domain/I<Domain>Repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";

@injectable()
export class Create<Domain> {
  constructor(
    @inject(I<Domain>Repository) private readonly repo: I<Domain>Repository
  ) {}

  async execute(data: Partial<<Domain>>): Promise<<Domain>> {
    if (!data) throw new UseCaseError("Datos requeridos");
    return this.repo.create(data);
  }
}
```
