# Servicios Compartidos entre Features (DI Distribuido)

Cómo gestionar la inyección de dependencias cuando un feature necesita consumir servicios de otro feature.

## Problema

El Feature A (ej: Inventory) expone `IInventoryService`. El Feature B (ej: Orders) lo necesita. En Forge no puede haber imports directos entre features (R8), y el contenedor de DI no debe centralizar registros de features (R2).

## Solución: Service Provider

Cada feature que EXPONE servicios compartidos tiene un `service-provider.ts` adicional además de su `di.ts`:

```
src/features/inventory/
├── di.ts                      # DI interna (controllers, use cases, repos)
└── service-provider.ts        # Servicios compartidos con otras features
```

### `di.ts` — solo DI interna

Registra lo que el feature necesita para funcionar internamente:

```ts
// src/features/inventory/di.ts
import { container } from "tsyringe";
import { IInventoryRepository } from "./domain/repositories/IInventory.repository.js";
import { InventoryRepository } from "./adapters/out/persistence/repositories/Inventory.repository.js";
import { ReserveStock } from "./application/use-cases/ReserveStock.uc.js";

// Solo dependencias internas del feature
container.registerSingleton<IInventoryRepository>("IInventoryRepository", InventoryRepository);
container.registerSingleton(ReserveStock);
```

### `service-provider.ts` — servicios compartidos

Expone una función que registra los servicios que otras features pueden consumir:

```ts
// src/features/inventory/service-provider.ts
import { container, DependencyContainer } from "tsyringe";
import { IInventoryService } from "@/shared/contracts/inventory/IInventoryService.js";
import { InventoryServiceImpl } from "./adapters/out/shared/InventoryService.js";

/**
 * Registra los servicios compartidos que Inventory provee a otras features.
 * Debe llamarse ANTES de que cualquier consumidor intente resolverlos.
 */
export function registerInventoryShared(container: DependencyContainer): void {
  container.registerSingleton<IInventoryService>("IInventoryService", InventoryServiceImpl);
}
```

```ts
// Versión manual (sin decorators)
import type { DependencyContainer } from "tsyringe";

export function registerInventoryShared(container: DependencyContainer): void {
  container.register("IInventoryService", {
    useClass: InventoryServiceImpl,
  });
}
```

### `app.ts` — orquestación con orden explícito

```ts
// src/app.ts
import { container } from "tsyringe";
import { registerInventoryShared } from "@/features/inventory/service-provider.js";
import "@/features/inventory/di.js";
import "@/features/orders/di.js";

// 1. Primero registrar servicios compartidos (proveedores)
registerInventoryShared(container);

// 2. Luego features consumidoras
//    (ya pueden resolver IInventoryService porque está registrado)
```

## Convenciones

| Aspecto | Regla |
|---------|-------|
| **Nombre** | `service-provider.ts` — siempre en plural, kebab-case |
| **Export** | `register<Domain>Shared(container)` — PascalCase del dominio + "Shared" |
| **Parámetro** | `DependencyContainer` de tsyringe (también sirve para DI manual) |
| **Ubicación** | Raíz del feature (`src/features/<name>/service-provider.ts`) |
| **Responsabilidad** | Solo servicios que otras features importan vía `@/shared/contracts/` |
| **Qué NO poner** | Use cases, controllers, repos internos — eso va en `di.ts` |

## ¿Quién necesita `service-provider.ts`?

| Tipo de feature | `di.ts` | `service-provider.ts` |
|-----------------|---------|----------------------|
| Feature puramente interno (nadie lo consume) | ✅ | ❌ |
| Feature que expone servicios compartidos | ✅ | ✅ |
| Feature que SOLO expone eventos (no servicios síncronos) | ✅ | ❌ (usar eventos) |

## Contrato en Shared

La interfaz del servicio compartido vive en `src/shared/contracts/`:

```ts
// src/shared/contracts/inventory/IInventoryService.ts
export interface IInventoryService {
  reserveStock(orderId: string, items: LineItem[]): Promise<ReservationResult>;
  releaseStock(reservationId: string): Promise<void>;
}

export type ReservationResult = {
  success: boolean;
  reservationId?: string;
  insufficientItems: { sku: string; available: number }[];
};
```

El feature consumidor importa solo la interfaz desde shared:

```ts
// src/features/orders/application/use-cases/PlaceOrder.uc.ts
import { inject, injectable } from "tsyringe";
import { IInventoryService } from "@/shared/contracts/inventory/IInventoryService.js";

@injectable()
export class PlaceOrder {
  constructor(
    @inject("IInventoryService") private readonly inventory: IInventoryService
  ) {}
}
```

## Manual vs Decorators

| Estrategia | `service-provider.ts` | Consumidor |
|------------|----------------------|------------|
| **Decorators** | `container.registerSingleton<T>(token, Impl)` | `@inject(token) private readonly field: T` |
| **Manual** | `container.register(token, { useClass: Impl })` | `container.resolve<T>(token)` en factory |

Ambos casos usan el mismo `service-provider.ts` — solo cambia si la implementación tiene `@injectable()` o no.

## Orden de registro (regla de oro)

Los `service-provider.ts` DEBEN ejecutarse antes que los `di.ts` de features consumidoras. En `app.ts`:

```ts
// PASO 1: Service providers (proveedores primero)
registerInventoryShared(container);
registerPaymentShared(container);

// PASO 2: DI de features (pueden depender de los providers arriba)
import "@/features/inventory/di.js";
import "@/features/payments/di.js";
import "@/features/orders/di.js"; // ← puede usar IInventoryService e IPaymentService
```

## Ver también

- `reference/di-strategies.md` — estrategias generales de DI
- `reference/cast.md` — Post-Cast DI Wiring
- `templates/feature/di.ts.md` — template de DI interna
- `templates/feature/service-provider.ts.md` — template de service provider
