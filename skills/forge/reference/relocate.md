# Relocate

Migra un feature existente de la arquitectura legacy a la nueva estructura basada en features.

## Cuándo usarlo

- El proyecto tiene código en ubicaciones legacy (`src/domain/`, `src/application/`, `src/adapters/out/database/`, etc.)
- Se necesita migrar feature por feature siguiendo orden topológico

## Flujo general

1. Identificar features legacy con `scripts/context.mjs`
2. Determinar orden topológico con `scripts/chain.mjs`
3. Migrar feature por feature en ese orden
4. Después de cada feature, ejecutar `forge quench`

## Fase 0 — Setup

1. Instalar dependencias del perfil activo (tsyringe, reflect-metadata, etc.)
2. Configurar tsconfig (decorators según perfil)
3. Configurar entry point (reflect-metadata import)
4. Identificar features existentes y sus dependencias
5. Determinar orden topológico

## Fase N — Migrar un feature

1. Crear estructura target bajo `src/features/<domain>/`
2. Migrar entity → `domain/<Domain>.entity.ts`
3. Migrar repository interface → `domain/I<Domain>Repository.ts`
4. Migrar use cases → `application/use-cases/` (agregar DI según perfil)
5. Migrar controller → `adapters/in/http/<Domain>Controller.ts`
6. Migrar routes → `adapters/in/http/<domain>.routes.ts`
7. Migrar schema → `adapters/out/persistence/<Domain>Schema.ts`
8. Migrar repository impl → `adapters/out/persistence/<Domain>Repository.ts`
9. Migrar mapper → `application/mappers/<Domain>.mapper.ts`
10. Eliminar archivo `*.di.ts` legacy (si existe)
11. Actualizar imports en routes/index.ts
12. Migrar tests y actualizar imports
13. Ejecutar validación: lint, build, test

## Por feature

- NUNCA migrar dos features simultáneamente
- Si algo se rompe, detener y revertir el feature actual
- No avanzar al siguiente si el actual no pasa validación

## Post-migración total

- Verificar que no queden archivos en ubicaciones legacy
- Eliminar directorios legacy vacíos
- Ejecutar `forge inspect` para confirmar puntuación
- Actualizar `ARCHITECTURE.md`
