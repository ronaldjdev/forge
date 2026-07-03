```typescript
// src/features/<domain>/__tests__/Create<Domain>.test.ts
//
// Convenciones para tests:
// - Usar extension .js en imports (ESM + verbatimModuleSyntax)
// - Usar "as const" para literales que forman parte de union types
// - Usar "result!" (non-null assertion) cuando execute() retorna T | null
// - Usar "(result as any)._id" si _id no existe en el tipo de dominio

import { describe, it, before } from "node:test";
import assert from "node:assert";
import { Create<Domain> } from "../application/use-cases/Create<Domain>.uc.js";
import type { I<Domain>Repository } from "../domain/repositories/I<Domain>.repository.js";
import type { <Domain> } from "../domain/entities/<Domain>.entity.js";

class Mock<Domain>Repository implements I<Domain>Repository {
  private store: <Domain>[] = [];

  async create(data: Partial<<Domain>>): Promise<<Domain>> {
    const entity = { id: "1", ...data } as <Domain>;
    this.store.push(entity);
    return entity;
  }

  async findById(id: string): Promise<<Domain> | null> {
    return this.store.find(e => (e as any).id === id) || null;
  }

  async findAll(): Promise<{ data: <Domain>[]; total: number }> {
    return { data: this.store, total: this.store.length };
  }

  async update(id: string, data: Partial<<Domain>>): Promise<<Domain> | null> {
    const idx = this.store.findIndex(e => (e as any).id === id);
    if (idx === -1) return null;
    this.store[idx] = { ...this.store[idx], ...data };
    return this.store[idx];
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter(e => (e as any).id !== id);
  }
}

describe("Create<Domain>", () => {
  let useCase: Create<Domain>;
  let mockRepo: Mock<Domain>Repository;

  before(() => {
    mockRepo = new Mock<Domain>Repository();
    useCase = new Create<Domain>(mockRepo);
  });

  it("debería crear una entidad <domain>", async () => {
    const input = { name: "test" as const };
    const result = await useCase.execute(input);
    assert.ok(result!);
    assert.equal((result as any)._id || result!.id, "1");
  });

  it("debería lanzar error si faltan datos requeridos", async () => {
    await assert.rejects(
      () => useCase.execute(null as any),
      { message: /requeridos|requerid/i }
    );
  });
});
```
