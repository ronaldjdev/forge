```typescript
// src/features/<domain>/application/queries/Get<Domain>Query.ts
import { injectable, inject } from "tsyringe";
import type { I<Domain>ReadRepository } from "../../adapters/out/read/I<Domain>ReadRepository.js";

export type <Domain>QueryResult = {
  // DTO plano desnormalizado para lectura
  id: string;
  // campos optimizados para consulta
};

@injectable()
export class Get<Domain>Query {
  constructor(
    @inject(I<Domain>ReadRepository)
    private readonly readRepo: I<Domain>ReadRepository,
  ) {}

  async execute(id: string): Promise<<Domain>QueryResult | null> {
    return this.readRepo.findById(id);
  }
}

// Query con filtros
export class List<Domain>Query {
  constructor(
    @inject(I<Domain>ReadRepository)
    private readonly readRepo: I<Domain>ReadRepository,
  ) {}

  async execute(filters: {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: Record<string, string>;
  }): Promise<{ data: <Domain>QueryResult[]; total: number }> {
    return this.readRepo.findMany(filters);
  }
}
```
