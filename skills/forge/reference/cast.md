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

## Flujo

1. Verificar que `src/platform/`, `src/shared/`, `src/infra/` existan (crearlos si no)
2. Determinar el nombre del feature (formato: kebab-case)
3. Crear estructura de directorios:
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
4. Crear archivos del feature en este orden (ver `templates/feature/`):
   - `<Name>.entity.ts` — interfaz de dominio
   - `I<Name>Repository.ts` — puerto de repositorio
   - `<Name>.mapper.ts` — mapper dominio ↔ persistencia
   - `<Name>Schema.ts` — schema de BD (según perfil)
   - `<Name>Repository.ts` — implementación del repositorio
   - Use cases (`Create.ts`, `Get.ts`, `List.ts`, `Update.ts`, `Delete.ts`)
   - `<Name>Controller.ts` — controlador HTTP
   - `<name>.routes.ts` — rutas HTTP
5. Registrar rutas en el enrutador principal
6. Ejecutar `forge quench` para verificar el feature
7. Actualizar `ARCHITECTURE.md`

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

## Post-creación

- `forge quench` — verificar que no hay violaciones
- `forge inspect` — confirmar puntuación
- `ARCHITECTURE.md` actualizado automáticamente
