# 07 — Sistema de Scoring

El comando `inspect` produce un score de **0 a 100** basado en 11 categorías de auditoría.

## Categorías y pesos

| Categoría | Peso | Qué verifica |
|-----------|------|--------------|
| **Structure** | 30 | Existencia de `src/features/`, subdirectorios de dominio, application, adapters |
| **Layers** | 25 | Imports prohibidos entre capas, lógica en controllers, BD fuera de repos |
| **Decorators** | 20 | `@injectable()` en use cases, controllers, repositories |
| **Ownership** | 20 | Huérfanos, duplicados, mal ubicados, platform layer |
| **Platform** | 14 | Existencia de platform/ y sus 6 componentes base |
| **Platform Domain** | 10 | Artefactos de dominio en platform/ (R13) |
| **Dependencies** | 15 | Health del grafo, violaciones CRITICAL/ERROR, risk score |
| **Graph** | 20 | Grafo arquitectónico: nodos, edges, violaciones R1-R9 |
| **Custom Rules** | 5 | Reglas custom en `.forge/rules.json` |
| **Naming** | 10 | Convenciones de nomenclatura (PascalCase, kebab-case, etc.) |
| **Import Conventions** | 20 | R10 (bare specifiers), R11 (.ts extension), R12 (DI inexistente) |

**Total: 189 puntos internos → normalizado a 100**

## Fórmula de normalización

```javascript
// inspect.mjs — buildReport()
const normalizedTotal = maxTotal > 0
  ? Math.round((total / maxTotal) * 100)
  : 0;

return { total: normalizedTotal, max: 100 };
```

Cada categoría contribuye proporcionalmente al score final.

## Cómo se calcula cada categoría

### Structure (0-30)

```javascript
let score = 0;

// +2 por existir src/features/
if (isDir(FEATURES)) score += 2;

// Por cada feature (max 20 por feature):
featScore += 3;  // domain/entities con entity.ts
featScore += 2;  // domain/repositories con repository.ts
featScore += 3;  // application/use-cases/
featScore += 2;  // application/mappers/
featScore += 3;  // adapters/in/http/controllers/
featScore += 2;  // adapters/in/http/routes/
featScore += 3;  // adapters/out/persistence/repositories/
featScore += 2;  // adapters/out/persistence/schemas/

score += Math.min(featScore, 20);  // cap por feature
return Math.min(score, 30);        // cap global
```

### Layers (0-25)

```javascript
// +3 si domain/ no importa de adapters
// +3 si application/ no importa de adapters/setting
// +2 si controllers no tienen lógica de negocio
// +2 si no hay imports directos entre features
// +2 si no hay acceso directo a BD fuera de repos

// Penalizaciones:
// -3 por domain → adapters
// -3 por application → adapters
// -2 por container.resolve()
// -3 por controller con lógica
// -2 por feature → feature
// -3 por acceso directo a BD
```

### Ownership (0-20)

```javascript
// +8 si ownership saludable (sin huérfanos ni duplicados)
// +3 si no hay componentes huérfanos
// +3 si no hay componentes duplicados
// +3 si no hay componentes mal ubicados
// +3 si platform layer existe
```

### Platform (0-14)

```javascript
// +2 si platform/ existe
// +2 por cada componente encontrado:
//   config, database, http, server, logger, di
// Max: 2 + 6×2 = 14
```

## Output del scoring

### Modo completo

```
══════════════════════════════════════════════════════════
   FORGE AUDIT — Reporte Hexagonal
══════════════════════════════════════════════════════════

  Puntaje total: 72/100 (72%) — C

  Resumen por severidad
   ERROR: 2
   WARNING: 5
   SUGGESTION: 1

  Estructura (22/30)
  ████████████████████░░░░░░░░░░░░░░░░░░░░
   ✔ src/features/ existe
   ✔ auth: domain/entities/<Name>.entity.ts
   ✘ [ERROR] users: falta domain/

  Ownership (17/20)
  ████████████████████████████████████░░░░░░
   ✔ Ownership saludable
   ✘ [SUGGESTION] Platform layer ausente
```

### Modo JSON

```json
{
  "total": 72,
  "max": 100,
  "categories": {
    "structure": { "score": 22, "checks": [...] },
    "layers": { "score": 18, "checks": [...] },
    ...
  },
  "violations": [...],
  "severityCounts": { "ERROR": 2, "WARNING": 5 }
}
```

### Modo resumen

```bash
forge inspect --summary
# Score: 72/100 (72%) | Violations: 8 | Health: fair
```

## Grados

| Score | Grado | Salud |
|-------|-------|-------|
| 90-100 | A | healthy |
| 80-89 | B | healthy |
| 65-79 | C | fair |
| 50-64 | D | fair |
| 0-49 | F | poor |
