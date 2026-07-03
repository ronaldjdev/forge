# Reforge

Refactoriza la arquitectura de un feature o de un componente de platform/shared/infra.

También renombra archivos para cumplir con las convenciones de naming (`reference/patterns.md`).

## Cuándo usarlo

- Un feature tiene violaciones arquitectónicas
- Un feature legacy necesita reestructurarse
- Un componente de platform necesita refinarse
- Un componente de shared necesita rediseñarse
- El grafo arquitectónico muestra violaciones que requieren intervención
- Un archivo no cumple con las convenciones de naming (`patterns.md`)
- Quieres renombrar un archivo y actualizar todos sus imports automáticamente

## Caso A — `reforge <filename>` (solo renombrar)

Renombra un único archivo según las convenciones de `reference/patterns.md` y actualiza todos los imports que lo referencian.

**No ejecuta backup** (el rename no modifica lógica de negocio).

### Flujo

1. Identificar la ruta del archivo (relativa a la raíz del proyecto)
2. Ejecutar `node {{AGENT_PATH}}/scripts/rename.mjs --detect --file <path>` para detectar violación
3. Si el archivo ya cumple naming, informar y terminar
4. Mostrar preview del cambio al usuario
5. Ejecutar `node {{AGENT_PATH}}/scripts/rename.mjs --file <path>` que:
   - Renombra físicamente el archivo
   - Escanea todos los `.ts`/`.js` del proyecto
   - Actualiza imports que referencian el path antiguo (relativos y absolutos)
6. Verificar con `forge quench`
7. Reportar resultado: archivo renombrado + cantidad de imports actualizados

### Ejemplo

```
$ forge reforge src/features/users/domain/userEntity.ts
  Renombrar:
    src/features/users/domain/userEntity.ts
    → src/features/users/domain/User.entity.ts
    Regla: feature/users/domain: <Name>.entity.ts

  ✓ Archivo renombrado: userEntity.ts → User.entity.ts
  ✓ Imports actualizados en 3 archivo(s):
       src/features/users/application/use-cases/CreateUser.uc.ts
       src/features/users/application/mappers/User.mapper.ts
       src/features/users/adapters/in/http/User.controller.ts
```

## Caso B — `reforge` (completo con auto-fix naming)

### Flujo

0. **Backup**: Ejecutar `forge rollback backup <target>` antes de cualquier cambio
1. Ejecutar `forge inspect` para obtener estado actual
2. Identificar violaciones en el grafo arquitectónico
3. Identificar ownership problemático (huérfanos, duplicados, mal ubicados)
4. **Detectar naming violations**: Ejecutar `node {{AGENT_PATH}}/scripts/rename.mjs --detect --json`
5. Si hay naming violations, preguntar al usuario: "¿Corregir naming conventions automáticamente?"
   - Si acepta, ejecutar `node {{AGENT_PATH}}/scripts/rename.mjs --all`
6. Decidir las acciones correctivas en orden:
   - Violaciones CRITICAL primero (R1, R2, R5, R6)
   - Violaciones ERROR después (R3, R4, R8, R9)
   - Ownership problemático
   - Naming violations (si no se corrigieron en paso 5)
   - Warnings
7. Ejecutar cambios en el feature o componente
8. **Eliminar estructura legacy** — después de migrar/refactorizar, limpiar todo el código fuente legacy que ya no tenga referencias activas:
   - Archivos originales en ubicaciones legacy (`src/domain/`, `src/application/`, `src/adapters/`, etc.)
   - Barrel files (`index.ts`) que exportaban exclusivamente código legacy
   - Directorios vacíos que quedaron huérfanos tras la migración
   - No dejar imports rotos ni archivos sin dueño
9. Verificar con `forge rollback verify` — si el score empeora, restaurar
10. Ejecutar `forge quench` para verificar 0 violaciones
11. Ejecutar `forge armorer` — confirmar ownership saludable (0 huérfanos, 0 duplicados)
12. Actualizar `ARCHITECTURE.md`

### Flags

| Flag | Efecto |
|------|--------|
| `--dry-run` | Preview de naming violations sin hacer cambios |
| `--fix-naming` | Corregir naming violations sin preguntar |
| `--skip-naming` | Omitir detección y corrección de naming |

## Rollback

Si la refactorización empeora el score arquitectónico, restaurar automáticamente:

```bash
forge rollback list
forge rollback restore <id>
```

## ⚠️ Regla crítica: Platform solo acepta backbone técnico

**Platform NO debe contener lógica de dominio.** Al refactorizar hacia `src/platform/`, verificar que el componente sea exclusivamente técnico:

| ✅ Permitido en Platform | ❌ Prohibido en Platform |
|---|---|
| config, server, logger, DI | Entidades de dominio |
| http, middleware, router | Casos de uso |
| cache, security, events | Repositorios (domain) |
| database, scheduler, observability | Mappers de dominio |
| Conexiones, clientes de infra | Schemas de entidades |
| Tokens de DI, contenedores | DTOs de negocio |
| Health checks, métricas | Lógica de reglas de negocio |

Si durante la refactorización un componente tiene lógica de dominio (entidades, `if/switch` con reglas de negocio, casos de uso), **debe ir a `src/features/<name>/`**, no a `platform/`. Violar esto introduce acoplamiento `platform → feature` (R2).

## Refactorización multi-capa

Reforge ahora considera las cuatro capas arquitectónicas:

- **Platform**: Mover componentes técnicos sueltos a `src/platform/` (nunca lógica de dominio)
- **Features**: Reestructurar features con violaciones
- **Shared**: Extraer código duplicado a `src/shared/`
- **Infra**: Organizar implementaciones concretas en `src/infra/`

## Post-refactorización

- `forge inspect` — confirmar mejora en puntuación
- `forge chain` — verificar que no se introdujeron ciclos
- `forge armorer` — verificar ownership saludable
