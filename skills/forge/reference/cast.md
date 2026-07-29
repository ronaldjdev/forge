# Cast

Crea un nuevo feature desde cero siguiendo la arquitectura hexagonal basada en features.

## Cuándo usarlo

- Agregar un nuevo dominio de negocio al proyecto
- El dominio no existe previamente en forma legacy

## Pre-condiciones

Antes de crear un feature, verificar la existencia de los layers arquitectónicos:

1. **Platform** — `src/platform/` (config, server, logger, di, etc.)
2. **Shared** — `src/shared/` (errors, contracts, types, utils)
3. **Infra** — `src/infra/` (prisma, redis, etc.)

Si alguno no existe, ejecutar `bootstrapPlatform()` automáticamente para crearlos.

## ⚠️ Pre-Cast Discovery — 3 Gates Obligatorios

**NO escribir código hasta pasar los 3 gates de aprobación.** Cast solía crear scaffolding directamente del nombre del feature. Esto producía features genéricos que requerían refactor posterior. Ahora todo `cast` requiere descubrimiento direccional multi-ronda.

Usar las **señales de `{{AGENT_PATH}}/scripts/forge-signals.mjs`** para contextualizar el descubrimiento:
- Si hay features existentes, revisar sus entidades y casos de uso para mantener coherencia.
- Si el perfil está detectado, usarlo para preguntas específicas (ej: "Prisma detectado → schema primero").
- Si hay archivos modificados en git, considerarlos como contexto del nuevo feature.

### Gate 1: Brief del Feature

Hacer **al menos 1 ronda de preguntas** usando la herramienta `question`. No inferir todas las respuestas del prompt inicial. Preguntar:

**Ronda 1 (obligatoria — 2-3 preguntas):**
- ¿Cuál es la entidad principal del dominio? (ej: "Factura", "Suscripción", "Producto")
- ¿Qué operaciones CRUD necesita? ¿Todas o solo un subconjunto?
- ¿Este feature se relaciona con algún feature existente? ¿Cuál y cómo?

**Ronda 2 (si aplica — preguntar solo si la Ronda 1 dejó dudas):**
- ¿Necesita eventos de dominio o integración con scheduler?
- ¿Expone API REST? ¿También GraphQL o gRPC?
- ¿Requiere cache? ¿Lectura > escritura o viceversa?

**No preguntes sobre detalles de implementación (nombre de columnas, puertos, etc.) en esta fase.** Eso se resuelve en el scaffold. El brief es sobre qué hace el feature, no cómo se implementa.

**Salida:** Brief del feature confirmado por el usuario.

### Gate 2: Confirmar Estructura

Tras el brief, presentar la estructura propuesta al usuario para confirmación:

```
src/features/<name>/
├── domain/
│   ├── <Name>.entity.ts
│   └── I<Name>.repository.ts
├── application/
│   ├── use-cases/
│   │   ├── Create<Name>.uc.ts
│   │   ├── Get<Name>.uc.ts
│   │   └── List<Name>.uc.ts     (los que apliquen según brief)
│   └── mappers/
│       └── <Name>.mapper.ts
└── adapters/
    ├── in/http/
    │   ├── <Name>.controller.ts
    │   └── <name>.routes.ts
    └── out/persistence/
        ├── <Name>.schema.ts
        └── <Name>.repository.ts
```

Preguntar: "¿Esta estructura cubre el dominio? ¿Falta algo, sobra algo?"

**No avanzar sin confirmación explícita del usuario.**

### Gate 3: Confirmar Wiring

Antes de escribir código, confirmar las decisiones de integración:

- **Repository**: "Inyecto `I<Name>Repository` vía interfaz. Implementación concreta en `adapters/out/persistence/repositories/`. ¿OK?"
- **Controller**: "El controller parsea, llama al use case, responde. Sin lógica de negocio. ¿OK?"
- **DI**: Según perfil: "Uso `@injectable()` + `@inject(Token)` con tsyringe" o "DI manual en bootstrap". ¿OK?
- **Routing**: "Registro las rutas en el enrutador principal de HTTP. ¿OK?"

Preguntar: "¿Confirmas este wiring antes de generar el feature?"

**Sin Gate 3 confirmado, no se escribe ni un archivo.**

---

## Flujo

1. Verificar que `src/platform/`, `src/shared/`, `src/infra/` existan (crearlos si no)
2. **Ejecutar Pre-Cast Discovery** (3 gates obligatorios)
3. Determinar el nombre del feature (formato: kebab-case) — ya debería estar claro del brief
4. Opcional: persistir brief en `.forge/features/<name>/brief.md` para futuras referencias
5. Crear estructura de directorios:
   ```
   src/features/<name>/
   ├── domain/
   ├── application/
   │   ├── use-cases/
   │   └── mappers/
   └── adapters/
       ├── in/http/
       └── out/persistence/
   ```
6. Crear archivos del feature en este orden (ver `templates/feature/`):
   - `<Name>.entity.ts` — interfaz de dominio
   - `I<Name>Repository.ts` — puerto de repositorio
   - `<Name>.mapper.ts` — mapper dominio ↔ persistencia
   - `<Name>Schema.ts` — schema de BD (según perfil)
   - `<Name>Repository.ts` — implementación del repositorio
   - Use cases (`Create.ts`, `Get.ts`, `List.ts`, `Update.ts`, `Delete.ts` — según brief)
   - `<Name>Controller.ts` — controlador HTTP
   - `<name>.routes.ts` — rutas HTTP
7. Registrar rutas en el enrutador principal
8. Ejecutar `forge quench` para verificar el feature
9. Actualizar `ARCHITECTURE.md` + estado persistente

## Convenciones

Ver `reference/patterns.md` para el patrón completo.

| Elemento | Formato | Ejemplo |
|---|---|---|
| Feature directory | `kebab-case/` | `credit-card/` |
| Entity | `<Name>.entity.ts` | `CreditCard.entity.ts` |
| Repository interface | `I<Name>.repository.ts` | `ICreditCard.repository.ts` |
| Repository impl | `<Name>.repository.ts` | `CreditCard.repository.ts` |
| Use case | `<Action>.uc.ts` | `CreateCreditCard.uc.ts` |
| Mapper | `<Name>.mapper.ts` | `CreditCard.mapper.ts` |
| Controller | `<Name>.controller.ts` | `CreditCard.controller.ts` |
| Routes | `<Name>.routes.ts` | `CreditCard.routes.ts` |
| Schema | `<Name>.schema.ts` | `CreditCard.schema.ts` |

## Con el perfil activo

Usar el perfil detectado para determinar:
- Estrategia de DI (tsyringe/manual/framework)
- Patrón de controlador (Express/Fastify/NestJS)
- Patrón de persistencia (Mongoose/Prisma/pg)
- Convenciones de imports (rutas relativas vs alias)
- Componentes de platform a usar (config, logger, http, database)

## ⚠️ Post-Cast: Entity Discovery

Antes de crear `<Name>.entity.ts`, verificar si la entidad ya existe:

1. **Buscar en `src/shared/contracts/`** por interfaces/DTOs existentes de la entidad
2. **Buscar en features hermanos** — si otro feature ya tiene una entidad similar, usar path relativo o crear un contrato compartido en shared
3. **Si es compartida**: crear la interfaz en `src/shared/contracts/I<Name>.ts` y que cada feature la implemente
4. **Si es nueva**: crear dentro del feature en `domain/entities/<Name>.entity.ts`

NUNCA buscar entidades en `src/platform/domain/entities/` — esto viola R13 (platform no contiene lógica de dominio).

## ⚠️ Post-Cast: DI Wiring

Después de crear los archivos del feature, generar los archivos de DI siguiendo los templates:

### `di.ts` — DI interna (siempre)

Crear `src/features/<name>/di.ts` usando `templates/feature/di.ts.md`. Este archivo es la **fuente única** de registro para dependencias internas del feature.

### `service-provider.ts` — servicios compartidos (solo si aplica)

Si el feature expone servicios que otras features consumen (vía `src/shared/contracts/`), crear `src/features/<name>/service-provider.ts` usando `templates/feature/service-provider.ts.md`.

Ejemplo: Inventory provee `IInventoryService` → Orders lo consume.

### `app.ts` — orquestación

```ts
// app.ts
import { container } from "tsyringe";

// 1. Service providers (proveedores ANTES que consumidores)
import { registerInventoryShared } from "@/features/inventory/service-provider.js";
registerInventoryShared(container);

// 2. DI de features
import "@/features/inventory/di.js";
import "@/features/orders/di.js";
```

### Reglas

1. **`di.ts`**: solo dependencias internas del feature (repos, use cases, controllers)
2. **`service-provider.ts`**: solo servicios compartidos vía `@/shared/contracts/`
3. **app.ts**: importar `di.ts` de cada feature (ej: `import "@/features/<name>/di.js";`). No registrar las mismas dependencias en app.ts.
4. **Controllers**: importar `./di.js` (del feature), NUNCA `bootstrap.di.js`
5. **Mongoose model()**: si el schema exporta `export default model()` (objeto, no clase), el DI debe usar `container.register(..., { useValue: ... })`, NO `registerSingleton`

> **⚠️ Cada feature DEBE registrar sus propias dependencias.** El Container centralizado en `platform/di/Container.ts` NO debe importar use cases de features (viola R2). El DI distribuido es la arquitectura correcta.

## ⚠️ Post-Cast: Tests

Después del scaffold, generar tests unitarios para cada use case siguiendo `templates/feature/test.ts.md`:

1. Crear `src/features/<name>/__tests__/Create<Name>.test.ts`
2. Usar `node:test` (sin dependencias externas)
3. Convenciones de test:
   - Extension `.js` en imports (no `.ts`)
   - `as const` para literales de union types: `status: "activo" as const`
   - `result!` (non-null assertion) cuando execute() retorna `T | null`
   - `(result as any)._id` si `_id` no existe en el tipo de dominio

## ⚠️ Post-Cast: Import Validation Checklist

Antes de dar por terminado el feature, verificar CADA archivo generado:

- [ ] Todos los imports locales usan prefijo `./` o `../` — sin bare specifiers (`import X from "domain/..."` ❌)
- [ ] Todos los imports tienen extensión `.js` — sin extensión `.ts`
- [ ] Entidades compartidas usan `@/shared/contracts/` — sin paths relativos rotos
- [ ] Controllers importan desde `./di.js` — no desde `bootstrap.di.js`
- [ ] Si el feature expone servicios compartidos, tiene `service-provider.ts` con función `register<Domain>Shared()`
- [ ] `app.ts` llama a `register<Domain>Shared(container)` ANTES de importar features consumidoras
- [ ] Nombres de método del controller coinciden con los de la ruta (ej: `createHandler` en controller → `controller.createHandler` en routes)
- [ ] DI usa `register({ useValue })` para modelos Mongoose — no `registerSingleton`
- [ ] Tests: `.js` extension, `as const`, `!`, `as any` para _id

## Post-creación

- `forge quench` — verificar que no hay violaciones
- `forge inspect` — confirmar puntuación
- `ARCHITECTURE.md` actualizado automáticamente
- `.forge/state.json` actualizado automáticamente
