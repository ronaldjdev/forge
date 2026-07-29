```typescript
// src/features/<domain>/service-provider.ts
// ── Servicios compartidos que <Domain> expone a otras features ──
//
// Este archivo registra los servicios que otras features pueden consumir
// a través de interfaces en src/shared/contracts/.
//
// app.ts debe llamar register<Domain>Shared(container) ANTES de
// importar los di.ts de features consumidoras.
//
// Convenciones:
// - Solo servicios cuyo contrato está en shared/contracts/
// - No registrar use cases, controllers ni repos internos (eso va en di.ts)
// - Nombre de exportación: register<Domain>Shared

<% if (diStrategy === 'manual') { %>
import type { DependencyContainer } from "tsyringe";
<% } else { %>
import { container, DependencyContainer } from "tsyringe";
<% } %>
import type { I<Domain>SharedService } from "@/shared/contracts/<domain>/I<Domain>SharedService.js";
import { <Domain>SharedServiceImpl } from "./adapters/out/shared/<Domain>SharedService.js";

export function register<Domain>Shared(container: DependencyContainer): void {
<% if (diStrategy === 'manual') { %>
  container.register<I<Domain>SharedService>("I<Domain>SharedService", {
    useClass: <Domain>SharedServiceImpl,
  });
<% } else { %>
  container.registerSingleton<I<Domain>SharedService>(
    "I<Domain>SharedService",
    <Domain>SharedServiceImpl,
  );
<% } %>
}
```
