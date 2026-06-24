# Reforge

Refactoriza la arquitectura de un feature existente o del proyecto completo.

## Cuándo usarlo

- Un feature tiene mala estructura interna
- Se necesita cambiar la organización de capas
- Hay que dividir un feature grande en subfeatures
- Se necesita unificar features duplicados
- El proyecto cambia de patrón arquitectónico

## Decision Framework

| Situación | Acción |
|---|---|
| Feature existente mal estructurado | Refactorizar in-place siguiendo target architecture |
| Controller con lógica de negocio | Extraer lógica a use case, inyectar en controller |
| Dependencias cíclicas entre features | Extraer interfaz compartida a shared/ |
| Feature demasiado grande (+20 use cases) | Dividir en subfeatures |
| Código duplicado entre features | Extraer a shared/ y documentar |

## Flujo

1. Diagnosticar el feature con `forge inspect`
2. Identificar las violaciones específicas
3. Planificar la refactorización (qué mover, qué crear, qué eliminar)
4. Ejecutar cambios
5. Validar con `forge quench`
6. Actualizar `ARCHITECTURE.md`

## Reglas

- No cambiar lógica de negocio durante refactorización arquitectónica
- Mantener tests funcionando después de cada cambio
- Un refactor por feature a la vez
- Si el cambio es muy grande, dividirlo en pasos más pequeños
