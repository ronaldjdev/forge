<img src="favicon.svg" alt="Forge Logo" width="100" height="100">

> **v1.5.0** — Adapters organizados en subdirectorios: `controllers/`, `routes/`, `repositories/`, `schemas/`

## Forge — Backend Architecture Operating System

**Forge** es un **sistema operativo arquitectónico** para backend. Modela, construye, audita, protege y evoluciona sistemas completos en cuatro dominios arquitectónicos: **Platform**, **Features**, **Shared** e **Infrastructure**.

No es un template ni una guía. Es un orquestador que opera sobre cualquier stack moderno como skill para [OpenCode](https://opencode.ai).

---

## ¿Qué problema resuelve?

Los proyectos backend degeneran en código acoplado porque la infraestructura técnica y las reglas de negocio se mezclan sin ownership claro. Forge impone una disciplina arquitectónica **auditable, automatizada y evolutiva** que:

- Modela el sistema en 4 capas: Platform (backbone técnico), Features (negocio), Shared (código puro) e Infrastructure (implementaciones)
- Mantiene el dominio aislado de infraestructura
- Previene acoplamiento directo entre features
- Detecta automáticamente ownership, huérfanos, duplicados y componentes mal ubicados
- Produce un **architecture graph** como fuente de verdad con 11 reglas (R1-R9 + R13 + R14)
- Genera y mantiene `ARCHITECTURE.md` vivo

---

## ¿Cuándo usar Forge?

| Escenario | Comando | Descripción |
|-----------|---------|-------------|
| **Proyecto nuevo** | `forge` | Inicializa platform/features/shared/infra, detecta stack, crea `ARCHITECTURE.md` |
| **Crear un nuevo dominio** | `cast` | Genera un feature completo desde cero (verifica platform/shared/infra primero) |
| **Auditar arquitectura** | `inspect` | Evaluación completa 190pts → 0-100 con ownership, platform, grafo e import conventions |
| **Migrar código legacy** | `relocate` | Traslada código a platform/, shared/, infra/ o features/ |
| **Refactorizar** | `reforge` | Reestructura features o componentes multi-capa |
| **Validar reglas** | `quench` | Verifica 14 reglas arquitectónicas (R1-R14) |
| **Endurecer DI** | `temper` | Aplica inyección por constructor, elimina service locators |
| **Analizar dependencias** | `chain` | Grafo multi-capa (platform, features, shared, infra), orden topológico, ciclos |
| **Documentar** | `inscribe` | Genera/actualiza `ARCHITECTURE.md` con métricas, ownership y violaciones |
| **Extraer a shared** | `smelt` | Mueve código puro a `src/shared/` (errores, utils, types) |
| **Ownership** | `inspect` | Incluido en auditoría — detecta huérfanos, duplicados, mal ubicados |

---

## Comandos en detalle

### `forge` — Inicialización

Detecta el stack tecnológico, ejecuta bootstrap de platform/shared/infra si no existen, determina el perfil activo, analiza ownership y prepara el proyecto. Crea `ARCHITECTURE.md` si no existe.

```
Boot sequence: context → armorer → profile → graph → chain → inspect → architecture → execute → architecture
```

### `cast` — Crear feature

Crea un nuevo feature (vertical slice) con estructura hexagonal completa. Antes de crear, verifica que `src/platform/`, `src/shared/` y `src/infra/` existan; si no, los crea automáticamente.

```
src/features/<name>/
├── domain/
│   ├── entities/         (<Domain>.entity.ts)
│   ├── repositories/     (I<Domain>.repository.ts)
│   ├── errors/           (<Domain>NotFound.error.ts)
│   └── events/           (<Domain>Created.event.ts)
├── application/
│   ├── use-cases/     (<Action>.uc.ts)
│   └── mappers/       (<Domain>.mapper.ts)
└── adapters/
    ├── in/http/
    │   ├── controllers/  (<Domain>.controller.ts)
    │   └── routes/       (<Domain>.routes.ts)
    └── out/persistence/
        ├── repositories/ (<Domain>.repository.ts)
        └── schemas/      (<Domain>.schema.ts)
```

### `inspect` — Auditoría arquitectónica

Evalúa 11 categorías contra un máximo de 190 puntos (normalizado a 0-100):

| Categoría | Puntos | Qué mide |
|-----------|--------|----------|
| Structure | 30 | Organización de platform, features, shared, infra |
| Layers | 25 | Aislamiento entre capas, imports prohibidos |
| Decorators | 20 | Decoradores @injectable()/@inject() en use cases, controllers, repos |
| Ownership | 20 | Huérfanos, duplicados, mal ubicados |
| Platform | 15 | Completitud del backbone técnico (config, server, logger, di, etc.) |
| Dependencies | 15 | Dirección de dependencias, ciclos, edges inválidos |
| Graph | 20 | Salud del grafo arquitectónico, risk score |
| Custom Rules | 5 | Reglas personalizadas desde `.forge/rules.json` |
| Naming | 10 | Convenciones de nomenclatura PascalCase/kebab |
| Import Conventions | 20 | R10-R12: bare specifiers, extensión .ts, imports prohibidos |

**Resultado**: Score 0-100 con grado A-F y severidades por cada violación.

### `relocate` — Migración legacy

Migra código legacy a cualquiera de los 4 layers según su naturaleza:
- Configuración, servidor, logger, DI → **Platform**
- Lógica de negocio → **Feature**
- Código reutilizable puro → **Shared**
- Implementaciones de BD, servicios externos → **Infra**

### `reforge` — Refactorización

Refactoriza la arquitectura considerando las 4 capas:
- Extraer lógica de negocio desde controllers a use cases
- Mover componentes huérfanos a su layer correcto
- Resolver dependencias cíclicas y violaciones R1-R9
- Migrar código entre capas

### `quench` — Validación

Ejecuta 14 reglas arquitectónicas (R1-R14) con severidad:

| Regla | Descripción | Severidad |
|-------|-------------|-----------|
| R1 | `feature → infra` (prohibido) | CRITICAL |
| R2 | `platform → feature` (prohibido) | CRITICAL |
| R3 | `shared → feature` (prohibido) | CRITICAL |
| R4 | `shared → infra` (prohibido) | CRITICAL |
| R5 | `domain → infra` (prohibido) | CRITICAL |
| R6 | `domain → platform` (prohibido) | ERROR |
| R7 | `infra → feature` (prohibido) | ERROR |
| R8 | Cross-feature direct imports | ERROR |
| R9 | Ciclos de dependencia | ERROR |
| R10 | Bare specifiers en imports locales | ERROR |
| R11 | Extensión `.ts` en imports (debe ser `.js`) | ERROR |
| R12 | Import a archivo DI inexistente (ej: `bootstrap.di.js`) | ERROR |
| R12b | `registerSingleton` con model() de Mongoose | WARNING |
| R13 | Platform con lógica dominio | CRITICAL |
| R14 | `shared → domain` (prohibido) | CRITICAL |

### `temper` — Endurecimiento de DI

Aplica reglas de inyección de dependencias según el perfil tecnológico. Para perfiles con tsyringe agrega decoradores `@injectable()` e `@inject()`. Para perfiles sin contenedor, implementa constructor injection manual.

### `chain` — Cadena de dependencias

Construye el grafo de dependencias multi-capa: dependencias dentro de platform, features, shared e infra, más detección de ciclos globales, cadenas ilegales y componentes aislados.

### `inscribe` — Documentación

Genera `ARCHITECTURE.md` vivo con:
- Metadatos del proyecto (framework, DB, ORM, DI strategy)
- Platform, features, shared e infra detectados
- Reporte de ownership (health, score, orphans, duplicates, misplaced)
- Architecture graph completo con 4 capas
- Dependency health, risk score y violaciones
- Último audit score

### `smelt` — Extracción a Shared

Identifica código duplicado o transversal y lo extrae a `src/shared/`:

```
src/shared/
├── errors/      # <Name>Error.ts (NotFoundError, ValidationError)
├── contracts/   # I<Name>.ts (IPaginatedResponse, IResponse)
├── types/       # <domain>.types.ts (api.types, user.types)
└── utils/       # <util>.ts (formatDate, pagination)
```

### `assay` — Ensayo multi-persona

Evalúa la arquitectura desde 5 perspectivas distintas:

| Persona | Enfoque |
|---------|---------|
| **Jeff Bezos** | Acoplamiento, escalabilidad, equipos autónomos (API mandate) |
| **Martin Fowler** | Refactoring, deuda técnica, microservicios vs monolitos |
| **Hacker** | Seguridad, performance, edge cases, vulnerabilidades |
| **Alex (PM)** | Tiempo de entrega, complejidad, ROI técnico |
| **Dra. Carter** | Dependencias cíclicas, violaciones de capas, salud estructural |

```
forge assay                    # Ensayo completo (5 personas)
forge assay --persona=bezos    # Solo Bezos
forge assay --persona=fowler   # Solo Fowler
forge assay --save             # Persiste en .forge/assay/
forge assay --json             # Salida JSON
```

### `nail / unnail` — Shortcuts de navegación

Fija rutas del proyecto como atajos para acceso rápido:

```
nail src/features/auth        # Crea atajo "auth"
nail src/platform/config      # Crea atajo "config"
nail --list                   # Lista atajos
unnail auth                   # Elimina atajo
```

### `forge state` — Estado persistente

Muestra y guarda el estado post-auditoría:

```
forge state          # Último score, grade, violaciones
forge state --show   # Estado detallado
forge state --json   # Salida JSON
forge state --history # Histórico de auditorías
```

### `forge hook` — Git pre-commit hook

Instala un hook pre-commit que valida la arquitectura en cada commit:

```
forge hook install      # Instalar hook
forge hook status       # Ver estado
forge hook check        # Validar archivos staged
forge hook uninstall    # Eliminar hook
```

### `forge rollback` — Restauración

Restaura el proyecto a un punto anterior:

```
forge rollback                   # Último checkpoint
forge rollback --list            # Lista checkpoints
forge rollback --id <checkpoint> # Restaurar específico
```

### `forge update` — Actualización

Verifica si hay una nueva versión de Forge disponible.

### Inline Ignores

Forge soporta excepciones línea por línea para reglas arquitectónicas:

```ts
// forge-ignore-next-line
import { something } from "../infra/prisma";  // ← no se reporta

// forge-ignore: R1
import { PrismaClient } from "../../infra/prisma/client"; // ← solo R1 ignorada

// forge-ignore: R1, R8
import { crossFeature } from "../other-feature/domain/Entity"; // ← R1 y R8 ignoradas
```

Usar `quench --show-ignores` para listar todos los ignores en el código.

### Flags adicionales

| Flag | Comando | Descripción |
|------|---------|-------------|
| `--fix` | `quench` | Auto-corrige violaciones WARNING/INFO (missing @injectable(), tsconfig, naming, container.resolve) |
| `--show-ignores` | `quench` | Muestra los inline ignores encontrados en el código |
| `--persona=<id>` | `assay` | Filtra ensayo por una persona (bezos, fowler, hacker, pm, senior) |
| `--save` | `assay` | Persiste ensayo en `.forge/assay/` |

---

## Modelo arquitectónico

Todo backend se modela en cuatro dominios obligatorios:

```
src/
├── platform/       ← Backbone técnico global
│   ├── config/         App.config.ts, Env.config.ts
│   ├── database/       Database.config.ts, Connection.ts
│   ├── http/           Router.ts, middleware/
│   ├── server/         Server.ts, App.ts
│   ├── logger/         Logger.config.ts, Logger.service.ts
│   ├── cache/          Cache.config.ts, Cache.service.ts
│   ├── security/       Auth.middleware.ts, Encryption.service.ts
│   ├── events/         EventBus.ts, EventHandler.ts
│   ├── scheduler/      Scheduler.config.ts
│   ├── observability/  Metrics.ts, Tracing.ts, Health.ts
│   └── di/             Container.ts, Tokens.ts
│
├── features/        ← Capacidades de negocio
│   └── <name>/
│       ├── domain/
│       │   ├── entities/       (<Domain>.entity.ts)
│       │   ├── repositories/   (I<Domain>.repository.ts)
│       │   ├── errors/         (<Domain>NotFound.error.ts)
│       │   └── events/         (<Domain>Created.event.ts)
│       ├── application/
│       └── adapters/
│           ├── in/http/
│           │   ├── controllers/   (<Domain>.controller.ts)
│           │   └── routes/        (<Domain>.routes.ts)
│           └── out/persistence/
│               ├── repositories/  (<Domain>.repository.ts)
│               └── schemas/       (<Domain>.schema.ts)
│
├── shared/          ← Componentes reutilizables puros
│   ├── errors/         NotFoundError.ts, ValidationError.ts
│   ├── contracts/      IPaginatedResponse.ts
│   ├── types/          api.types.ts
│   └── utils/          formatDate.ts, pagination.ts
│
└── infra/           ← Implementaciones concretas
    ├── prisma/         Prisma.client.ts, Prisma.service.ts
    ├── mongodb/        Mongo.config.ts
    ├── redis/          Redis.config.ts, Redis.service.ts
    └── mail/           Mail.config.ts, Mail.service.ts
```

### Reglas de dependencia

**Permitido**: `feature → platform`, `feature → shared`, `platform → infra`, `adapter → infra`, `feature → domain`

**Prohibido**: `feature → infra` (R1), `platform → feature` (R2), `shared → feature` (R3), `shared → infra` (R4), `domain → infra` (R5), `domain → platform` (R6), `infra → feature` (R7), cross-feature (R8), ciclos (R9), platform con lógica dominio (R13), `shared → domain` (R14)

### Convenciones de nomenclatura

| Elemento | Formato | Ejemplo |
|---|---|---|
| Directorios | `kebab-case/` | `credit-card/`, `event-bus/` |
| Archivos | `<PascalCase>.<artefacto>.ts` | `User.entity.ts` |
| Interfaces | `I<PascalCase>.<artefacto>.ts` | `IUser.repository.ts` |
| Puertos (domain) | `<Name>.port.ts` | `PaymentPort.port.ts` |
| Use cases | `<Action>.uc.ts` | `CreateUser.uc.ts` |
| Clases | `PascalCase` | `UserController` |
| Funciones | `camelCase` | `formatDate` |

Ver `reference/patterns.md` para el detalle completo.

---

## Características clave

- **4 dominios arquitectónicos**: Platform (backbone), Features (negocio), Shared (código puro), Infra (implementaciones)
- **Architecture graph como fuente de verdad**: 6 tipos de nodo (platform, feature, shared, infra, domain, adapter), 11 reglas (R1-R9 + R13 + R14), risk score y dependency health
- **Ownership automático**: Detección de huérfanos, duplicados, componentes mal ubicados y sugerencias de reubicación
- **Scoring arquitectónico**: 190 puntos en 11 categorías, normalizado a 0-100 con grado A-F
- **10 perfiles tecnológicos predefinidos**: Express + MongoDB, Express + PostgreSQL, Express + Prisma, Express + Drizzle, Fastify + MongoDB, Fastify + PostgreSQL, Fastify + Prisma, NestJS + MongoDB, NestJS + PostgreSQL, NestJS + Prisma
- **Boot sequence obligatoria**: 9 pasos que garantizan contexto completo antes de cualquier acción
- **Documentación automática**: `ARCHITECTURE.md` vivo que se actualiza tras cada operación
- **Sin dependencias runtime**: Solo Node ≥ 18, todo corre con scripts ESM propios

---

## Perfiles tecnológicos

| Perfil | Framework | BD | ORM | Estrategia DI |
|--------|-----------|----|-----|---------------|
| `express-mongodb` | Express | MongoDB | Mongoose | tsyringe |
| `express-postgres` | Express | PostgreSQL | raw pg | Manual |
| `express-prisma` | Express | PostgreSQL | Prisma | tsyringe |
| `express-drizzle` | Express | PostgreSQL | Drizzle | tsyringe |
| `fastify-mongodb` | Fastify | MongoDB | Mongoose | Manual |
| `fastify-postgres` | Fastify | PostgreSQL | Prisma | Manual |
| `fastify-prisma` | Fastify | PostgreSQL | Prisma | Manual |
| `nestjs-mongodb` | NestJS | MongoDB | Mongoose | NestJS DI |
| `nestjs-postgres` | NestJS | PostgreSQL | Prisma | NestJS DI |
| `nestjs-prisma` | NestJS | PostgreSQL | Prisma | NestJS DI |

Cada perfil define estructura de directorios, setup de DI, routing, persistencia, testing y naming conventions.

---

## Arquitectura de Forge

Forge opera en dos capas:

### CLI Installer (`src/cli.js`)

Script Node.js que instala la skill en el proyecto destino. Soporta instalación local (`.opencode/skills/forge/`) y global (`~/.config/opencode/skills/forge/`).

### Skill Runtime (`skills/forge/`)

Donde vive toda la inteligencia arquitectónica:

| Módulo | Propósito |
|--------|-----------|
| `SKILL.md` | Orquestración principal — boot sequence, command routing, execution flow |
| `scripts/context.mjs` | Detecta stack, platform, features, shared, infra, grafo y estado del proyecto |
| `scripts/armorer.mjs` | Ownership: huérfanos, duplicados, mal ubicados, sugerencias |
| `scripts/profile.mjs` | Matchea stack contra perfiles conocidos o sintetiza uno genérico |
| `scripts/graph.mjs` | Grafo completo: 6 tipos de nodo, 4 capas, 11 reglas (R1-R9 + R13 + R14), risk score, dependency health |
| `scripts/chain.mjs` | Grafo multi-capa (platform, features, shared, infra) con orden topológico |
| `scripts/detect.mjs` | Validación de reglas R1-R14 con inline ignores, `--fix` e import conventions |
| `scripts/inspect.mjs` | Orquesta auditoría completa con reporte coloreado |
| `scripts/architecture.mjs` | Genera/actualiza `ARCHITECTURE.md` vivo |
| `scripts/bootstrap.mjs` | Inicializa platform/shared/infra según perfil (interno) |
| `scripts/formatter.mjs` | Output unificado: colores, JSON, scoreBar, formatCheck |
| `scripts/registry/rules.mjs` | Registry de reglas R1-R9 + R13 + R14 + custom rules desacoplado |
| `scripts/assay.mjs` | Ensayo multi-persona (Bezos, Fowler, Hacker, PM, Arquitecta) |
| `scripts/forgeSentinel.mjs` | PostToolUse hook adapter para Claude/Codex/agents |
| `scripts/forgeSentinel-lib.mjs` | Lógica compartida del hook PostToolUse |
| `scripts/forgeSmith.mjs` | preToolUse gate para Cursor (deniega escrituras con violaciones CRITICAL/ERROR) |
| `scripts/forgeSmith-admin.mjs` | Gestión de hooks (on/off/status) para Cursor |
| `scripts/posttool.mjs` | PostToolUse hook (deprecated — usar forgeSentinel) |
| `scripts/forge-config.mjs` | Persistencia de config, estado e histórico |
| `scripts/forge-state.mjs` | CLI wrapper de estado post-auditoría |
| `scripts/forge-signals.mjs` | Manejo de señales (SIGINT, SIGTERM) |
| `scripts/forge-api.mjs` | Validación de contratos API |
| `scripts/hook.mjs` | Gestión de git pre-commit hook |
| `scripts/pin.mjs` | Shortcuts de navegación (`nail`/`unnail`) |
| `scripts/rollback.mjs` | Restauración de puntos de guardado |
| `scripts/rename.mjs` | Renombrado bulk de componentes |
| `scripts/parse-imports.mjs` | Parsing de imports ESM |
| `scripts/update.mjs` | Verificador de actualizaciones |
| `reference/` | Documentación detallada de cada comando y principios |
| `reference/patterns.md` | Convenciones de nomenclatura globales |
| `reference/assay.md` | Documentación del comando assay |
| `reference/hooks.md` | Documentación del sistema de hooks |
| `profiles/` | 10 perfiles tecnológicos detallados |
| `templates/feature/` | 19 templates TypeScript para features |
| `templates/platform/` | 6 templates para componentes de platform |
| `templates/shared/` | 4 templates para shared (errors, contracts, types, utils) |
| `templates/infra/` | 4 templates para infra (prisma, mongodb, redis, mail) |

---

## Instalación

```bash
npx @ronaldjdevfs/forge install          # Wizard interactivo
npx @ronaldjdevfs/forge install --all    # Todos los agentes detectados
npx @ronaldjdevfs/forge install --cursor # Solo Cursor
npx @ronaldjdevfs/forge install --claude # Solo Claude Code
```

| Flag | Agente | Hook activo |
|------|--------|-------------|
| `--opencode` | OpenCode | forgeSentinel (vía SKILL.md) |
| `--cursor` | Cursor | forgeSmith (preToolUse) |
| `--claude` | Claude Code | forgeSentinel (PostToolUse) |
| `--codex` | Codex CLI | forgeSentinel (PostToolUse) |
| `--gemini` | Gemini Code Assist | — |
| `--all` | Todos los anteriores | — |
| `--global` | `~/.config/opencode/` | forgeSentinel |

**Requisitos**: Node.js ≥ 18

---

## Uso

Una vez instalada, OpenCode carga automáticamente la skill `forge` al trabajar en el proyecto. Usa `forge --help` para ver la lista completa de comandos. Los comandos también se invocan por lenguaje natural:

| Lenguaje natural | Comando |
|---|---|
| "inicializar", "setup", "empezar" | `forge` |
| "crear feature", "nuevo dominio" | `cast` |
| "inspeccionar", "diagnóstico", "evaluar" | `inspect` |
| "trasladar", "mover" | `relocate` |
| "refactorizar", "rediseñar" | `reforge` |
| "verificar", "quench", "checklist" | `quench` |
| "templar", "endurecer", "mejorar" | `temper` |
| "cadena", "grafo", "acoplamiento" | `chain` |
| "inscribir", "grabar", "ARCHITECTURE.md" | `inscribe` |
| "fundir", "compartir", "mover a shared" | `smelt` |
| "examinar", "calidad", "opinión", "critique" | `assay` |
| "fijar", "pinar", "shortcut" | `nail` |
| "desfijar", "despinar" | `unnail` |
| "estado", "state", "último audit" | `forge state --show` |
| "hook", "pre-commit", "githook" | `forge hook` |
| "api", "contrato", "openapi", "swagger" | `forge api` |
| "rollback", "restaurar", "deshacer" | `forge rollback` |
| "actualizar", "update", "nueva versión" | `forge update` |

---

### Sistema de Hooks Multi-Agent

Forge se despliega como **skill** en múltiples agentes de IA simultáneamente, con hooks adaptados a cada plataforma:

| Agente | Hook | Cuándo se ejecuta | Efecto |
|--------|------|-------------------|--------|
| **OpenCode** | forgeSentinel | PostToolUse tras Edit/Write | Reporta violaciones como reminder |
| **Claude Code** | forgeSentinel | PostToolUse tras Edit/Write/MultiEdit | Reporta violaciones como reminder |
| **Cursor** | forgeSmith | preToolUse antes de cada escritura | Puede DENEGAR la escritura |
| **Codex CLI** | forgeSentinel | PostToolUse tras Edit/Write/apply_patch | Reporta violaciones como reminder |
| **Gemini** | SKILL.md | Al cargar el agente | Instrucciones arquitectónicas |

Todos los hooks comparten la misma lógica de detección de violaciones R1-R14 a través de `forgeSentinel-lib.mjs`.

---

## Desarrollo

```bash
git clone <repo>
cd forge
npm install     # instala dependencias de desarrollo
```

La skill se referencia desde `.opencode/skills/forge/` como symlink a `skills/forge/`, por lo que cualquier cambio se refleja inmediatamente.

### Versionado (SemVer)

| Bump | Cuándo | Ejemplo |
|------|--------|---------|
| **MAJOR** `X.0.0` | Breaking changes: comandos eliminados/renombrados, reglas eliminadas, cambios que requieren reinstalación o migración manual | `2.0.0` |
| **MINOR** `x.Y.0` | Funcionalidad nueva retrocompatible: nuevos comandos, nuevas reglas, cambios en estructura de scaffolding, nuevos perfiles/agentes/hooks | `1.5.0` |
| **PATCH** `x.y.Z` | Fixes sin cambio funcional: detección de reglas, paths en templates, rendering, docs | `1.4.4` |

Ante la duda entre dos niveles, usar el mayor. Ver `AGENTS.md` para la checklist completa de release.


---

## Licencia

Apache-2.0

---

## Autor

**Ronald J. Echeverry** — [@ronaldjdev](https://github.com/ronaldjdev)
