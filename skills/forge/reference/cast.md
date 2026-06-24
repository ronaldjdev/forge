# Cast

Crea un nuevo feature desde cero siguiendo la arquitectura hexagonal basada en features.

## Cuándo usarlo

- Agregar un nuevo dominio de negocio al proyecto
- El dominio no existe previamente en forma legacy

## Flujo

1. Determinar el nombre del feature (formato: kebab-case)
2. Crear estructura de directorios:
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
3. Crear archivos del feature en este orden (ver `templates/feature/`):
   - `<Name>.entity.ts` — interfaz de dominio
   - `I<Name>Repository.ts` — puerto de repositorio
   - `<Name>.mapper.ts` — mapper dominio ↔ persistencia
   - `<Name>Schema.ts` — schema de BD (según perfil)
   - `<Name>Repository.ts` — implementación del repositorio
   - Use cases (`Create.ts`, `Get.ts`, `List.ts`, `Update.ts`, `Delete.ts`)
   - `<Name>Controller.ts` — controlador HTTP
   - `<name>.routes.ts` — rutas HTTP
4. Registrar rutas en el enrutador principal
5. Ejecutar `forge quench` para verificar el feature
6. Actualizar `ARCHITECTURE.md`

## Convenciones

| Elemento | Nombre |
|---|---|
| Feature directory | kebab-case (`credit-card`) |
| Entity interface | PascalCase (`CreditCard.entity.ts`) |
| Repository interface | I + PascalCase (`ICreditCardRepository.ts`) |
| Use case | PascalCase (`Create.ts`) |
| Controller | PascalCase + Controller (`CreditCardController.ts`) |
| Routes file | kebab-case + .routes (`credit-card.routes.ts`) |
| Schema | PascalCase + Schema (`CreditCardSchema.ts`) |
| Mapper | PascalCase + .mapper (`CreditCard.mapper.ts`) |

## Con el perfil activo

Usar el perfil detectado para determinar:
- Estrategia de DI (tsyringe/manual/framework)
- Patrón de controlador (Express/Fastify/NestJS)
- Patrón de persistencia (Mongoose/Prisma/pg)
- Convenciones de imports (rutas relativas vs alias)

## Post-creación

- `forge quench` — verificar que no hay violaciones
- `forge inspect` — confirmar puntuación
