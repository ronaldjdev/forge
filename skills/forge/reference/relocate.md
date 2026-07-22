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

0. **Backup automático**: Ejecutar `forge rollback backup <target>` antes de cualquier cambio
1. Identificar el componente a migrar
2. Clasificarlo en el layer correcto:
   - Configuración, servidor, logger, DI → **Platform**
   - Lógica de negocio, entidades, casos de uso → **Feature**
   - Código reutilizable sin dependencias externas → **Shared**
   - Implementaciones de BD, servicios externos → **Infra**
3. Crear la estructura target según el layer
4. Migrar archivos manteniendo la lógica intacta
5. Actualizar imports
6. **Eliminar estructura legacy por completo** — no dejar archivos huérfanos, barrel files (index.ts) vacíos, ni directorios legacy sin contenido. Verificar:
   - `src/application/use-cases/<name>/` queda vacío y se elimina
   - `src/adapters/in/http/controllers/` sin archivos del feature migrado
   - `src/adapters/in/http/routes/` sin archivos del feature migrado
   - `src/domain/entities/`, `src/domain/repositories/` sin duplicados
   - `src/setting/dependencies/` sin `.di.ts` del feature migrado
   - Barrel files (`index.ts`) que solo exportaban código legacy se eliminan
7. Verificar con `forge rollback verify` — si el score empeora, restaurar con `forge rollback restore <backup-id>`
8. Ejecutar `forge quench` para verificar 0 violaciones
9. Ejecutar `forge armorer` — confirmar que no hay huérfanos ni duplicados del código legacy
10. Actualizar `ARCHITECTURE.md`

## Rollback

Si la migración introduce violaciones (R1-R9), el agente DEBE restaurar automáticamente:

```bash
forge rollback list          # ver backups disponibles
forge rollback restore <id>  # restaurar
```

El backup se almacena en `.forge/backups/<target>--<timestamp>/` y preserva la estructura original completa.

## ⚠️ Regla crítica: No insertar lógica de dominio en Platform

Al migrar componentes legacy, **nunca colocar lógica de dominio en `src/platform/`**. Platform es exclusivamente backbone técnico.

| Tipo de componente | Layer correcto |
|---|---|
| Configuración de framework, servidor, logger, DI | `src/platform/` |
| Middleware HTTP, routers, guards, interceptors | `src/platform/http/` |
| Conexiones a BD, clientes Redis, mail | `src/infra/` |
| Código utilitario puro (sin lógica de negocio) | `src/shared/` |
| **Entidades, value objects, reglas de dominio** | **`src/features/<name>/domain/`** |
| **Casos de uso, servicios de aplicación** | **`src/features/<name>/application/`** |
| **Controladores, repositorios, schemas** | **`src/features/<name>/adapters/`** |

Si un archivo contiene `class`, `interface` con reglas de negocio, `if/switch` con lógica de dominio, o importa desde `features/`, pertenece a un feature, no a platform.

## Estrategias por layer

| Layer | Desde | Hacia |
|---|---|---|
| Platform | `src/config/`, `src/setting/`, `src/middleware/` | `src/platform/<name>/` |
| Feature | `src/application/use-cases/<name>/` | `src/features/<name>/` |
| Shared | `src/utils/`, `src/helpers/`, `src/lib/` | `src/shared/<name>/` |
| Infra | `src/database/`, `src/providers/` | `src/infra/<name>/` |

## Ver también

- `reference/anti-corruption-layer.md` — aislamiento de legacy durante migración
- `reference/modular-monolith.md` — decisión de estructura al migrar features
- `reference/reforge.md` — refactor post-migración
