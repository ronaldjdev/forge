# Evolutionary Architecture

La arquitectura no es un diseño inicial que se congela. Es una estructura que evoluciona con el conocimiento del dominio, el tamaño del equipo y las restricciones del negocio. Forge está diseñado para guiar esa evolución sin reescrituras.

---

## Definición

Una **arquitectura evolutiva** es aquella en la que los cambios significativos pueden realizarse de forma incremental, guiados por **fitness functions** que verifican que las propiedades arquitectónicas se mantienen.

**Propiedades de una arquitectura evolutiva:**
- **Incremental**: los cambios grandes se dividen en pasos pequeños y reversibles
- **Guiada por métricas**: se sabe si un cambio mejora o degrada la arquitectura
- **Fitness functions automatizadas**: las propiedades se verifican en CI
- **Sin big-bang rewrites**: nunca se reescribe desde cero

---

## Fitness Functions

Una **fitness function** es un test automatizado que valida una característica arquitectónica. Forge ya implementa varias:

### Built-in (R1-R9)

Las 9 reglas de Forge son fitness functions:

```ts
// scripts/registry/rules.mjs (conceptual)
const rules = {
  R1: {
    name: "feature → infra prohibited",
    severity: "CRITICAL",
    check: (edge) =>
      edge.from.type === "feature" && edge.to.type === "infra",
  },
  R8: {
    name: "cross-feature direct import prohibited",
    severity: "ERROR",
    check: (edge) =>
      edge.from.type === "feature" && edge.to.type === "feature",
  },
  // R2-R7, R9 con estructura similar
};
```

Estas fitness functions se ejecutan en:
- `node scripts/detect.mjs` — detección local
- `forge quench` — validación completa
- PostToolUse hook — después de cada escritura del agente

### Custom Fitness Functions

Los usuarios pueden registrar sus propias funciones:

```ts
// scripts/registry/rules.mjs
import { registerRule } from "./registry/rules.mjs";

registerRule({
  id: "CUSTOM_01",
  name: "no console.log in use-cases",
  severity: "WARNING",
  check: ({ filePath, content }) =>
    filePath.includes("application/use-cases") && content.includes("console.log"),
  description: "Los casos de uso no deben tener console.log. Usar logger inyectado.",
});
```

### Tipos de Fitness Functions

| Tipo | Ejecución | Ejemplo |
|---|---|---|
| **Estática** | Lint/build | `detect.mjs` analiza imports |
| **Dinámica** | Runtime | Verificar que event bus no pierde eventos |
| **Benchmark** | CI periódico | Tiempo de respuesta de queries < 200ms |
| **Trigger-based** | Evento (PR, deploy) | No hay imports directos entre features |
| **Contrato** | CI multi-servicio | Las APIs son compatibles con versiones anteriores |

### Integración en CI

```yaml
# .github/workflows/forge-fitness.yml
jobs:
  forge-quench:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: node .opencode/skills/forge/scripts/detect.mjs
        env:
          FORGE_STRICT: "true"
      - run: node .opencode/skills/forge/scripts/chain.mjs --json
```

---

## Guided Change

El flujo de cambio guiado de Forge asegura que cada modificación arquitectónica es segura:

### 1. Estado actual (before)

```bash
node scripts/inspect.mjs --json
# Score: 85
# Violaciones: 2 WARNING (R9 borderline, naming)
```

### 2. Proponer cambio

```bash
forge reforge --move features/old-payments to features/payments/v2
# Generate plan: split feature, add ACL, migrate use-cases
```

### 3. Verificar antes de aplicar

```bash
forge quench --diff
# Simula el cambio y reporta impacto en score
```

### 4. Ejecutar con rollback

```bash
forge reforge --apply
# Guarda backup en .forge/backup/
# Si falla: forge rollback --last
```

### 5. Estado actual (after)

```bash
node scripts/inspect.mjs --json
# Score: 92 (+7)
# Violaciones: 0
```

Si el score baja, el cambio se rechaza automáticamente (configurable con `FORGE_ALLOW_DEGRADE=true`).

---

## Evolución Típica de un Proyecto

### Fase 1: Prototipo / MVP

```
10 features, 1 equipo, monolith
Reglas: todas activas
Foco: velocidad de entrega
Tolerancia: alta para violaciones temporales
```

```bash
forge quench --allow-warnings
# Reporta violaciones pero no bloquea
```

### Fase 2: Crecimiento

```
20 features, 2 equipos, monolith modular
Reglas: estrictas (R1-R9 bloquean)
Foco: boundaries
```

```bash
forge quench --strict
# Las violaciones ERROR bloquean el PR
```

### Fase 3: Escalamiento

```
40 features, 3+ equipos, modular → microservicios
Reglas: R1-R9 + custom (CQRS, outbox, SLA)
Foco: autonomía de equipos
```

```bash
forge inspect --extended
# Incluye fitness functions custom
```

### Fase 4: Madurez

```
N features, equipos autónomos, servicios independientes
Reglas: fitness functions distribuidas
Foco: evolución continua sin regresión
```

---

## Smallest Viable Change

Cada cambio arquitectónico debe ser el **cambio más pequeño que mejora la arquitectura sin romper funcionalidad**.

| Cambio grande (evitar) | Cambio pequeño (preferir) |
|---|---|
| Extraer 3 features como microservicios a la vez | Extraer 1 feature, verificar, repetir |
| Reescribir todo el ORM | Migrar un repositorio por PR |
| Refactorizar "toda la capa de aplicación" | Refactorizar un caso de uso, probar, continuar |
| Cambiar de framework | Aislar framework tras interfaces primero, luego reemplazar |

### Patrón: Scaffolding antes de Feature

Antes de implementar una feature completa, crear la estructura del feature y verificar que no viola reglas:

```bash
# Fase 1: scaffold
mkdir -p src/features/payments/{domain,application/use-cases,adapters/in/http,adapters/out/persistence}
touch src/features/payments/domain/PaymentEntity.ts
touch src/features/payments/domain/IPaymentRepository.ts

# Fase 2: verify
forge quench
# Score: 100 (aún sin implementar, pero los boundaries son correctos)

# Fase 3: implementar use-case
touch src/features/payments/application/use-cases/ProcessPaymentUseCase.ts

# Fase 4: verify again
forge quench
# Score: 100 (el use-case solo importa de domain y shared)
```

---

## Evolución de Boundaries

### Partir un feature

```bash
# Antes: features/catalog (15k líneas, toca todo)
# Después: features/catalog (core) + features/search (búsqueda)

forge cast search --from catalog
# 1. Crea features/search con estructura completa
# 2. Mueve SearchService y SearchIndexer de catalog a search
# 3. Crea contratos en shared/contracts/catalog/ para que search consuma datos
# 4. Verifica que no quedan imports de catalog → search ni viceversa
```

### Fusionar features

```bash
# Antes: features/standard-checkout + features/express-checkout
# (80% del código duplicado entre ambos)

forge reforge --merge features/express-checkout into features/checkout
# 1. Mueve el código único de express a checkout
# 2. Parametriza el checkout con "mode: standard | express"
# 3. Elimina features/express-checkout
# 4. Verifica que nada importaba de express-checkout
```

### Mover un shared kernel a package

```bash
# Antes: src/shared/contracts/ (referencia local)
# Después: @company/contracts (npm package)

forge reforge --publish shared/contracts as @company/contracts
# 1. Extrae contracts/ a packages/contracts/
# 2. Configura build con tsc
# 3. Actualiza imports en todas las features
# 4. Verifica con detect.mjs que los nuevos imports son válidos
```

---

## Anti-patrones

| Anti-patrón | Problema | Solución |
|---|---|---|
| **Big-Bang Rewrite** | Se reescribe todo. El sistema legacy se congela. El rewrite nunca alcanza el feature parity. | Strangler Fig + ACL. Migrar feature por feature. |
| **Frozen Architecture** | "No podemos cambiar la estructura ahora". La arquitectura se vuelve un impedimento. | Fitness functions + guided change. El cambio seguro está soportado por diseño. |
| **Analysis Paralysis** | Demasiado tiempo diseñando, poco tiempo implementando. | Smallest viable change. El diseño emerge, no se predice. |
| **Tech Debt sin métrica** | Se acumula deuda sin saber cuánta ni dónde. | `forge inspect` da score numérico. La deuda se mide, no se estima. |
| **Rewrite por moda** | "Pasamos a microservicios porque es moderno". | `reference/modular-monolith.md` — evaluar antes de partir. |
| **Golden Hammer** | Forzar CQRS, Event Sourcing o Hexagonal en features que no lo necesitan. | Cada referencia tiene "cuándo usarlo". Si no aplica, no lo fuerces. |

---

## Conexión con Forge

| Comando | Acción |
|---|---|
| `forge inspect` | Score + violaciones + fitness functions |
| `forge quench` | Ejecuta fitness functions en el código actual |
| `forge reforge` | Cambio arquitectónico guiado con verificación |
| `forge relocate` | Migración incremental con rollback |
| `forge chain` | Verifica que el grafo de dependencias evoluciona saludablemente |
| `forge graph` | Visualiza la evolución del grafo arquitectónico |

## Ver también

- `reference/adr.md` — ADRs como registro de cambios evolutivos
- `reference/principles.md` — principios que las fitness functions protegen
- `reference/modular-monolith.md` — evolución de monolith a microservicios
