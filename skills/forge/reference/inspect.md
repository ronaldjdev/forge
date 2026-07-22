# Inspect

Inspecciona la conformidad arquitectónica del proyecto.

## Cuándo usarlo

- Diagnóstico inicial del proyecto
- Post-migración de feature
- On demand para verificar estado actual
- Pre-deploy para garantizar calidad arquitectónica

## Flujo

1. Ejecutar `{{AGENT_PATH}}/scripts/context.mjs` → detectar stack y estructura
2. Ejecutar `{{AGENT_PATH}}/scripts/profile.mjs` → determinar perfil activo
3. Ejecutar `{{AGENT_PATH}}/scripts/chain.mjs` → construir cadena de dependencias
4. Ejecutar `{{AGENT_PATH}}/scripts/detect.mjs` → detectar todas las violaciones
5. Ejecutar `{{AGENT_PATH}}/scripts/armorer.mjs` → ownership (huérfanos, duplicados)
6. Ejecutar `{{AGENT_PATH}}/scripts/graph.mjs` → grafo arquitectónico
7. Construir reporte con puntuación y severidades
8. Ejecutar `{{AGENT_PATH}}/scripts/architecture.mjs` → actualizar ARCHITECTURE.md
9. Mostrar resultado al usuario

## Categorías

| Categoría | Máx | Qué mide |
|---|---|---|
| Estructura | 30 | Features completos (domain, application, adapters) |
| Capas | 25 | Imports prohibidos, lógica en controllers, BD directa |
| Decoradores | 20 | @injectable y @inject presentes donde corresponde |
| Ownership | 20 | Huérfanos, duplicados, mal ubicados |
| Platform | 15 | Componentes técnicos base presentes |
| Platform Domain | 10 | Sin lógica de dominio en platform |
| Dependencias | 15 | Health del grafo, risk score |
| Grafo | 20 | Violaciones arquitectónicas (R1-R14), ciclos |
| Custom Rules | 5 | Reglas definidas en .forge/rules.json |
| Naming | 10 | Convenciones de nomenclatura |
| Import Conventions | 20 | Bare specifiers, extensiones, DI wiring |
| **Total** | **190** | |

## Severidades

| Severidad | Significado | Ejemplo |
|---|---|---|
| CRITICAL | Viola principio fundamental de la arquitectura | Domain importa de adapters |
| ERROR | Viola una regla de capas o estructura | Controller con lógica de negocio |
| WARNING | Inconsistencia que requiere atención | Feature sin repository interface |
| INFO | Observación sobre el estado actual | Feature incompleto |
| SUGGESTION | Recomendación de mejora | Usar tokens de clase en @inject |

## Interpretación del score

El score se calcula como porcentaje: `(puntos obtenidos / 190) * 100`. Rango: 0-100%.

| Rango | Nota | Significado |
|---|---|---|
| 90-100% | A | Arquitectura sólida. Cumple todos los principios. |
| 80-89% | B | Inconsistencias menores. Fáciles de corregir. |
| 65-79% | C | Varias violaciones. Requiere trabajo estructurado. |
| 50-64% | D | Arquitectura comprometida. Migración necesaria. |
| 0-49% | F | Proyecto no migrado o con violaciones generalizadas. |

## Ejecución

```bash
node {{AGENT_PATH}}/scripts/inspect.mjs
node {{AGENT_PATH}}/scripts/inspect.mjs --json
node {{AGENT_PATH}}/scripts/detect.mjs --severity ERROR
```

## Ver también

- `reference/evolutionary-architecture.md` — fitness functions como complemento al inspect
- `reference/assay.md` — interpretación cualitativa multi-persona del reporte de inspect
- `reference/principles.md` — principios contra los que inspect evalúa el proyecto
```
