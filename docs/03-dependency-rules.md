# 03 — Reglas de Dependencia (R1-R14)

Forge valida 14 reglas arquitectónicas. Cada regla tiene una severidad y un fix sugerido.

## Reglas de dependencia entre capas (R1-R9)

### R1 — Feature no importa infraestructura — CRITICAL

```typescript
// ✘ VIOLACIÓN (R1)
// features/auth/repo.ts
import { PrismaClient } from "@prisma/client";  // ← feature → infra

// ✔ CORRECTO
// features/auth/domain/repositories/IAuth.repository.ts
export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
}

// features/auth/adapters/out/persistence/PrismaAuth.repository.ts
import { PrismaClient } from "@prisma/client";  // ← adapter → infra (permitido)
export class PrismaAuthRepository implements IAuthRepository {
  constructor(private prisma: PrismaClient) {}
}
```

### R2 — Platform no importa features — CRITICAL

```typescript
// ✘ VIOLACIÓN (R2)
// platform/logger/Logger.ts
import { getUserConfig } from "@/features/users/";  // ← platform → feature

// ✔ CORRECTO
// Inyectar la dependencia como interfaz
```

### R3 — Shared no importa features — ERROR

```typescript
// ✘ VIOLACIÓN (R3)
// shared/utils/format.ts
import { UserRole } from "@/features/auth/domain/";  // ← shared → feature
```

### R4 — Shared no importa infraestructura — ERROR

```typescript
// ✘ VIOLACIÓN (R4)
// shared/errors/AppError.ts
import { logger } from "@/platform/logger/";  // ← shared → infra
```

### R5 — Domain no importa infraestructura — CRITICAL

```typescript
// ✘ VIOLACIÓN (R5)
// features/auth/domain/entities/User.entity.ts
import { UserSchema } from "@/infra/prisma/";  // ← domain → infra
```

### R6 — Domain no importa platform — ERROR

```typescript
// ✘ VIOLACIÓN (R6)
// features/auth/domain/entities/User.entity.ts
import { config } from "@/platform/config/";  // ← domain → platform
```

### R7 — Infra no importa features — ERROR

```typescript
// ✘ VIOLACIÓN (R7)
// infra/prisma/PrismaClient.ts
import { AuthConfig } from "@/features/auth/";  // ← infra → feature
```

### R8 — Features no se importan directamente — WARNING

```typescript
// ✘ VIOLACIÓN (R8)
// features/users/use-cases/GetUser.uc.ts
import { AuthRepository } from "@/features/auth/adapters/";  // ← feature → feature

// ✔ CORRECTO
// Extraer interfaz a shared/contracts/ y inyectar
```

### R9 — Sin ciclos de dependencias — ERROR

```
features/auth → features/users → features/auth  ← CICLO
```

## Reglas de imports (R10-R12)

### R10 — No bare specifiers — ERROR

```typescript
// ✘ VIOLACIÓN (R10)
import { UserRepository } from "domain/repositories/";  // ← sin prefijo

// ✔ CORRECTO
import { UserRepository } from "@/domain/repositories/";  // ← alias @/
import { UserRepository } from "../domain/repositories/"; // ← relativo
```

### R11 — Extensión .js obligatoria — ERROR

```typescript
// ✘ VIOLACIÓN (R11)
import { User } from "./User.entity.ts";  // ← .ts en vez de .js

// ✔ CORRECTO (ESM)
import { User } from "./User.entity.js";
```

### R12 — No importar archivos DI inexistentes — CRITICAL

```typescript
// ✘ VIOLACIÓN (R12)
import { container } from "./bootstrap.di.js";  // ← archivo inexistente

// ✔ CORRECTO
import { container } from "./di.js";  // ← feature di.ts
```

## Regla de dominio en platform (R13)

### R13 — Platform no contiene lógica de dominio — CRITICAL

Forge detecta automáticamente:
- Archivos con sufijos `.entity.ts`, `.uc.ts`, `.mapper.ts` en `platform/`
- Contenido con keywords de dominio: `entity`, `useCase`, `valueObject`

## Regla de shared → domain (R14)

### R14 — Shared no importa domain de features — ERROR

```typescript
// ✘ VIOLACIÓN (R14)
// shared/contracts/IUser.ts
import { User } from "@/features/auth/domain/";  // ← shared → domain
```

## Resumen de severidades

| Regla | Severidad | Descripción |
|-------|-----------|-------------|
| R1 | CRITICAL | Feature → infra |
| R2 | CRITICAL | Platform → feature |
| R3 | ERROR | Shared → feature |
| R4 | ERROR | Shared → infra |
| R5 | CRITICAL | Domain → infra |
| R6 | ERROR | Domain → platform |
| R7 | ERROR | Infra → feature |
| R8 | WARNING | Feature → feature |
| R9 | ERROR | Ciclos |
| R10 | ERROR | Bare specifiers |
| R11 | ERROR | Extensión .ts |
| R12 | CRITICAL | DI inexistente |
| R13 | CRITICAL | Domain en platform |
| R14 | ERROR | Shared → domain |

## Inline Ignores

Para excepcionar reglas específicas:

```typescript
// forge-ignore-next-line
import { x } from '../infra/prisma';  // ← ignora TODAS las reglas

// forge-ignore: R1
import { x } from '../infra/prisma';  // ← ignora solo R1

// forge-ignore: R1, R8
import { x } from '../infra/prisma';  // ← ignora R1 y R8
```
