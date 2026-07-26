# 08 — Grafo Arquitectónico

El grafo arquitectónico es la **fuente de verdad** del sistema. Cada componente es un nodo tipado, cada relación es un edge validado.

## Construcción del grafo

`graph.mjs` recorre `src/` y construye:

```
Nodos (qué existe):
  - platform/config      → layer: platform
  - features/auth        → layer: feature
  - shared/errors        → layer: shared
  - infra/prisma         → layer: infra
  - features/auth/domain → layer: domain
  - features/auth/adapters/in/http → layer: adapter

Edges (qué importa qué):
  - features/auth → platform/config    (tipo: depends)
  - features/auth → shared/errors      (tipo: depends)
  - features/auth → infra/prisma       (tipo: violates, regla: R1)
```

## Tipos de nodo

| Tipo | Layer | Ejemplo |
|------|-------|---------|
| `platform` | platform | `platform/config`, `platform/database` |
| `feature` | feature | `features/auth`, `features/users` |
| `shared` | shared | `shared/errors`, `shared/contracts` |
| `infra` | infra | `infra/prisma`, `infra/redis` |
| `domain` | domain | `features/auth/domain` |
| `adapter` | adapter | `features/auth/adapters/in/http` |
| `application` | application | `features/auth/application` |

## Tipos de edge

| Tipo | Significado |
|------|-------------|
| `depends` | Dependencia permitida |
| `violates` | Dependencia prohibida (viola una regla) |
| `imports` | Import directo entre archivos |

## Detección de imports

`parse-imports.mjs` analiza cada archivo TypeScript:

```javascript
// Intento 1: AST parsing con @typescript-eslint/parser
if (hasTypescriptEslint) {
  return parseWithAST(content, filePath);
}

// Intento 2: Regex (fallback)
const importRe = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
```

Para cada import detectado, se clasifica el edge:

```javascript
function classifyEdge(sourceFile, importSource) {
  const fromLayer = detectLayer(sourceFile);   // features/auth/domain → "domain"
  const toLayer = detectLayer(importSource);   // infra/prisma → "infra"

  // Validar contra las reglas R1-R9
  const violation = checkViolation(fromLayer, toLayer);
  if (violation) {
    return { type: "violates", rule: violation.rule };
  }

  return { type: "depends" };
}
```

## Motor de reglas

`registry/rules.mjs` define cada regla con una función `check(graph)`:

```javascript
defineRule({
  id: "R1",
  name: "Feature no importa infraestructura",
  severity: "CRITICAL",
  check: (graph) => {
    const violations = [];
    for (const edge of graph.edges) {
      if (edge.fromLayer === "feature" && edge.toLayer === "infra") {
        violations.push({
          rule: "R1",
          severity: "CRITICAL",
          from: edge.from,
          to: edge.to,
          file: edge.file,
        });
      }
    }
    return violations;
  },
});
```

## Violaciones detectadas

El grafo produce violaciones que se alimentan a:

1. **`inspect.mjs`** → Scoring y reporte
2. **`quench`** → Validación y auto-fix
3. **`forgeSentinel`** → Hook post-escritura
4. **`forgeSmith`** → Hook pre-escritura (puede denegar)
5. **`hook.mjs`** → Git pre-commit

## Visualización del grafo

```bash
# Output JSON con nodos, edges y violaciones
node scripts/graph.mjs --json
```

```json
{
  "nodes": [
    { "id": "platform/config", "layer": "platform", "file": "src/platform/config/" },
    { "id": "features/auth", "layer": "feature", "file": "src/features/auth/" },
    { "id": "shared/errors", "layer": "shared", "file": "src/shared/errors/" }
  ],
  "edges": [
    { "from": "features/auth", "to": "platform/config", "type": "depends" },
    { "from": "features/auth", "to": "shared/errors", "type": "depends" }
  ],
  "violations": [],
  "stats": {
    "totalNodes": 3,
    "totalEdges": 2,
    "violations": 0,
    "health": "healthy",
    "dependencyHealth": 100
  }
}
```

## Grafo multi-capa (chain.mjs)

`chain.mjs` extiende el grafo con análisis topológico:

```javascript
{
  "topologicalOrder": ["shared", "platform", "features/auth", "features/users"],
  "hasCycles": false,
  "illegalChains": [],
  "layers": {
    "platform": { "nodes": [...], "order": [...] },
    "features": { "nodes": [...], "order": [...] },
    "shared": { "nodes": [...], "order": [...] },
    "infra": { "nodes": [...], "order": [...] }
  }
}
```

El orden topológico determina el **orden correcto de build/despliegue**.
