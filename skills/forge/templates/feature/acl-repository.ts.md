```typescript
// src/features/<domain>/adapters/out/legacy-<system>/<Domain>ACL.ts
import { injectable, inject } from "tsyringe";
import type { I<Domain>Repository } from "../../domain/repositories/I<Domain>.repository.js";
import type { <Domain>Entity } from "../../domain/entities/<Domain>.entity.js";
import { <Domain>Gateway } from "./<Domain>Gateway.js";
import { <Domain>Translator } from "./<Domain>Translator.js";

@injectable()
export class <Domain>ACLRepository implements I<Domain>Repository {
  constructor(
    @inject(<Domain>Gateway) private readonly gateway: <Domain>Gateway,
    @inject(<Domain>Translator) private readonly translator: <Domain>Translator,
  ) {}

  async findById(id: string): Promise<<Domain>Entity | null> {
    try {
      const dto = await this.gateway.fetch(id);
      return dto ? this.translator.toDomain(dto) : null;
    } catch (error) {
      if (error.message.includes("404")) return null;
      throw new Error("<Domain>Repository.fetchFailed");
    }
  }

  async save(entity: <Domain>Entity): Promise<<Domain>Entity> {
    const dto = this.translator.toExternal(entity);
    const result = await this.gateway.upsert(dto);
    return this.translator.toDomain(result);
  }

  async delete(id: string): Promise<void> {
    await this.gateway.remove(id);
  }
}
```
