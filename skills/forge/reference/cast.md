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

Usar las **señales de `forge-signals.mjs`** para contextualizar el descubrimiento:
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

- **Repository**: "Inyecto `I<Name>Repository` vía interfaz. Implementación concreta en `adapters/out/persistence/`. ¿OK?"
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

Antes de crear `<Name>.entity.ts`, verificar si la entidad ya existe como entidad compartida:

1. **Buscar en `src/platform/domain/entities/<Name>.ts`** — si existe, NO crear entidad local
2. **Si es compartida**: usar `@/domain/entities/<Name>.js` en vez de path relativo en todos los templates
3. **Verificar también** `src/shared/contracts/` por interfaces/DTOs existentes

Regla: si la entidad vive fuera del feature, todos los imports deben usar path alias `@/domain/`, no `../../`.

## ⚠️ Post-Cast: DI Wiring

Después de crear los archivos del feature, generar `di.ts` siguiendo el template `templates/feature/di.ts.md`:

1. **Feature con DI propia**: crear `src/features/<name>/di.ts` usando el template
2. **Feature SIN DI propia**: si ya existe `src/platform/setting/dependencies/<name>.di.js`, los controllers deben importar desde allí en vez de `bootstrap.di.js`
3. **Controllers**: asegurar que el import en el controller apunte a `@/setting/dependencies/<name>.di.js` o `./di.js`, NUNCA a `bootstrap.di.js`
4. **Mongoose model()**: si el schema exporta `export default model()` (objeto, no clase), el DI debe usar `container.register(..., { useValue: ... })`, NO `registerSingleton`

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
- [ ] Entidades compartidas usan `@/domain/` — sin paths relativos rotos
- [ ] Controllers importan desde `di.ts` o `@/setting/dependencies/` — no desde `bootstrap.di.js`
- [ ] Nombres de método del controller coinciden con los de la ruta (ej: `createHandler` en controller → `controller.createHandler` en routes)
- [ ] DI usa `register({ useValue })` para modelos Mongoose — no `registerSingleton`
- [ ] Tests: `.js` extension, `as const`, `!`, `as any` para _id

## Post-creación

- `forge quench` — verificar que no hay violaciones
- `forge inspect` — confirmar puntuación
- `ARCHITECTURE.md` actualizado automáticamente
- `.forge/state.json` actualizado automáticamente
