```typescript
// src/features/<domain>/adapters/out/persistence/<Domain>.repository.ts
import { injectable } from "tsyringe";
import type { <Domain> } from "../../../domain/<Domain>.entity.js";
import type { I<Domain>Repository } from "../../../domain/I<Domain>.repository.js";
import { <Domain>Mapper } from "../../../application/mappers/<Domain>.mapper.js";
import <Domain>Model from "./<Domain>.schema.js";
import { RepositoryError } from "@/shared/errors/RepositoryError.js";

@injectable()
export class <Domain>Repository implements I<Domain>Repository {
  async create(data: Partial<<Domain>>, session?: unknown): Promise<<Domain>> {
    try {
      const doc = await <Domain>Model.create(data);
      return <Domain>Mapper.toDomain(doc.toObject());
    } catch (error: any) {
      throw new RepositoryError("Error al crear", error);
    }
  }

  async findById(id: string, session?: unknown): Promise<<Domain> | null> {
    try {
      const doc = await <Domain>Model.findById(id).lean();
      return doc ? <Domain>Mapper.toDomain(doc) : null;
    } catch (error: any) {
      throw new RepositoryError("Error al buscar por ID", error);
    }
  }

  async findAll(options?: Record<string, unknown>): Promise<{ data: <Domain>[]; total: number }> {
    try {
      const docs = await <Domain>Model.find().lean();
      return {
        data: docs.map((d: any) => <Domain>Mapper.toDomain(d)),
        total: docs.length,
      };
    } catch (error: any) {
      throw new RepositoryError("Error al listar", error);
    }
  }

  async update(id: string, data: Partial<<Domain>>, session?: unknown): Promise<<Domain> | null> {
    try {
      const doc = await <Domain>Model.findByIdAndUpdate(id, data, { new: true }).lean();
      return doc ? <Domain>Mapper.toDomain(doc) : null;
    } catch (error: any) {
      throw new RepositoryError("Error al actualizar", error);
    }
  }

  async delete(id: string, session?: unknown): Promise<void> {
    try {
      await <Domain>Model.findByIdAndDelete(id);
    } catch (error: any) {
      throw new RepositoryError("Error al eliminar", error);
    }
  }
}
```
