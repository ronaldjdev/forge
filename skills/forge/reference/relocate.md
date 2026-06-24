# Relocate

Migra un feature existente desde estructura legacy hacia la arquitectura basada en features.

También puede migrar componentes legacy a los layers Platform, Shared o Infrastructure.

## Cuándo usarlo

- El proyecto tiene código legacy fuera de `src/features/`
- Hay componentes en directorios legacy que deben migrarse a:
  - `src/platform/` (si es infraestructura técnica global)
  - `src/shared/` (si es código reutilizable puro)
  - `src/infra/` (si es implementación concreta)
  - `src/features/<name>/` (si es lógica de negocio)

## Flujo

1. Identificar el componente a migrar
2. Clasificarlo en el layer correcto:
   - Configuración, servidor, logger, DI → **Platform**
   - Lógica de negocio, entidades, casos de uso → **Feature**
   - Código reutilizable sin dependencias externas → **Shared**
   - Implementaciones de BD, servicios externos → **Infra**
3. Crear la estructura target según el layer
4. Migrar archivos manteniendo la lógica intacta
5. Actualizar imports
6. Eliminar estructura legacy
7. Ejecutar `forge quench` para verificar
8. Actualizar `ARCHITECTURE.md`

## Estrategias por layer

| Layer | Desde | Hacia |
|---|---|---|
| Platform | `src/config/`, `src/setting/`, `src/middleware/` | `src/platform/<name>/` |
| Feature | `src/application/use-cases/<name>/` | `src/features/<name>/` |
| Shared | `src/utils/`, `src/helpers/`, `src/lib/` | `src/shared/<name>/` |
| Infra | `src/database/`, `src/providers/` | `src/infra/<name>/` |
