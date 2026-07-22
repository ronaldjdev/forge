```typescript
// src/features/<domain>/adapters/out/legacy-<system>/translators/<Domain>Translator.ts
import type { <Domain>Entity } from "../../../domain/entities/<Domain>.entity.js";
import type { External<Domain>DTO } from "./External<Domain>DTO.js";

export class <Domain>Translator {
  toDomain(dto: External<Domain>DTO): <Domain>Entity {
    return {
      id: dto.externalId,
      // mapear campos del DTO externo al modelo de dominio
      // name: dto.fullName,
      // email: dto.emailAddress,
      // status: dto.isActive ? "active" : "inactive",
    } as <Domain>Entity;
  }

  toExternal(entity: <Domain>Entity): External<Domain>DTO {
    return {
      externalId: entity.id,
      // mapear campos del dominio al DTO externo
    } as External<Domain>DTO;
  }
}
```
