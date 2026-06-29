# Inspect

Inspecciona la conformidad arquitectónica del proyecto.

## Cuándo usarlo

- Diagnóstico inicial del proyecto
- Post-migración de feature
- On demand para verificar estado actual
- Pre-deploy para garantizar calidad arquitectónica

## Flujo

1. Ejecutar `scripts/context.mjs` → detectar stack y estructura
2. Ejecutar `scripts/profile.mjs` → determinar perfil activo
3. Ejecutar `scripts/chain.mjs` → construir cadena de dependencias
4. Ejecutar `scripts/detect.mjs` → detectar todas las violaciones
5. Construir reporte con puntuación y severidades
6. Mostrar resultado al usuario

## Categorías

| Categoría | Pts | Qué mide |
|---|---|---|
| Estructura | 30 | Features completos (domain, application, adapters) |
| Capas | 25 | Imports prohibidos, lógica en controllers, BD directa |
| Decoradores | 20 | @injectable y @inject presentes donde corresponde |
| Legacy | 15 | Archivos residuales en ubicaciones antiguas |
| Configuración | 10 | tsconfig, dependencias, reflect-metadata |
| Grafo | 20 | Violaciones arquitectónicas (R1-R6), risk score, salud del grafo |

## Severidades

| Severidad | Significado | Ejemplo |
|---|---|---|
| CRITICAL | Viola principio fundamental de la arquitectura | Domain importa de adapters |
| ERROR | Viola una regla de capas o estructura | Controller con lógica de negocio |
| WARNING | Inconsistencia que requiere atención | Feature sin repository interface |
| INFO | Observación sobre el estado actual | Feature incompleto |
| SUGGESTION | Recomendación de mejora | Usar tokens de clase en @inject |

## Interpretación del score

| Rango | Nota | Significado |
|---|---|---|
| 90-100 | A | Arquitectura sólida. Cumple todos los principios. |
| 80-89 | B | Inconsistencias menores. Fáciles de corregir. |
| 65-79 | C | Varias violaciones. Requiere trabajo estructurado. |
| 50-64 | D | Arquitectura comprometida. Migración necesaria. |
| 0-49 | F | Proyecto no migrado o con violaciones generalizadas. |

## Ejecución

```bash
node .opencode/skills/forge/scripts/inspect.mjs
node .opencode/skills/forge/scripts/inspect.mjs --json
node .opencode/skills/forge/scripts/detect.mjs --severity ERROR

## Ver también

- `reference/evolutionary-architecture.md` — fitness functions como complemento al inspect
- `reference/assay.md` — interpretación cualitativa multi-persona del reporte de inspect
- `reference/principles.md` — principios contra los que inspect evalúa el proyecto
```
