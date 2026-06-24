<img src="logo.png" alt="Forge Logo" width="300" height="300">

# Forge — Backend Architecture Operating System

**Forge** es un **sistema operativo arquitectónico** para backend. Modela, construye, audita, protege y evoluciona sistemas completos en cuatro dominios arquitectónicos: **Platform**, **Features**, **Shared** e **Infrastructure**.

No es un template ni una guía. Es un orquestador que opera sobre cualquier stack moderno como skill para [OpenCode](https://opencode.ai).

---

## ¿Qué problema resuelve?

Los proyectos backend degeneran en código acoplado porque la infraestructura técnica y las reglas de negocio se mezclan sin ownership claro. Forge impone una disciplina arquitectónica **auditable, automatizada y evolutiva** que:

- Modela el sistema en 4 capas: Platform (backbone técnico), Features (negocio), Shared (código puro) e Infrastructure (implementaciones)
- Mantiene el dominio aislado de infraestructura
- Previene acoplamiento directo entre features
- Detecta automáticamente ownership, huérfanos, duplicados y componentes mal ubicados
- Produce un **architecture graph** como fuente de verdad con 9 reglas (R1-R9)
- Genera y mantiene `ARCHITECTURE.md` vivo

---

## ¿Cuándo usar Forge?

| Escenario | Comando | Descripción |
|-----------|---------|-------------|
| **Proyecto nuevo** | `forge` | Inicializa platform/features/shared/infra, detecta stack, crea `ARCHITECTURE.md` |
| **Crear un nuevo dominio** | `cast` | Genera un feature completo desde cero (verifica platform/shared/infra primero) |
| **Auditar arquitectura** | `inspect` | Evaluación completa 110pts → 0-100 con ownership, platform y grafo |
| **Migrar código legacy** | `relocate` | Traslada código a platform/, shared/, infra/ o features/ |
| **Refactorizar** | `reforge` | Reestructura features o componentes multi-capa |
| **Validar reglas** | `quench` | Verifica 9 reglas arquitectónicas (R1-R9) |
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
Boot sequence: context → bootstrap → profile → armorer → graph → chain → inscribe
```

### `cast` — Crear feature

Crea un nuevo feature (vertical slice) con estructura hexagonal completa. Antes de crear, verifica que `src/platform/`, `src/shared/` y `src/infra/` existan; si no, los crea automáticamente.

```
src/features/<name>/
├── domain/
│   ├── <Domain>.entity.ts
│   └── I<Domain>.repository.ts
├── application/
│   ├── use-cases/     (<Action>.uc.ts)
│   └── mappers/       (<Domain>.mapper.ts)
└── adapters/
    ├── in/http/       (<Domain>.controller.ts, <Domain>.routes.ts)
    └── out/persistence/ (<Domain>.repository.ts, <Domain>.schema.ts)
```

### `inspect` — Auditoría arquitectónica

Evalúa 6 categorías contra un máximo de 110 puntos (normalizado a 0-100):

| Categoría | Puntos | Qué mide |
|-----------|--------|----------|
| Structure | 20 | Organización de platform, features, shared, infra |
| Layers | 20 | Aislamiento entre capas, imports prohibidos |
| Ownership | 20 | Huérfanos, duplicados, mal ubicados |
| Platform | 15 | Completitud del backbone técnico (config, server, logger, di, etc.) |
| Dependencies | 15 | Dirección de dependencias, ciclos, edges inválidos |
| Graph | 20 | Salud del grafo arquitectónico, risk score |

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

Ejecuta 9 reglas arquitectónicas (R1-R9) con severidad:

| Regla | Descripción | Severidad |
|-------|-------------|-----------|
| R1 | `feature → infra` (prohibido) | CRITICAL |
| R2 | `platform → feature` (prohibido) | CRITICAL |
| R3 | `shared → feature` (prohibido) | ERROR |
| R4 | `shared → infra` (prohibido) | ERROR |
| R5 | `domain → infra` (prohibido) | CRITICAL |
| R6 | `domain → platform` (prohibido) | CRITICAL |
| R7 | `infra → feature` (prohibido) | WARNING |
| R8 | Cross-feature direct imports | ERROR |
| R9 | Ciclos de dependencia | ERROR |

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
│       ├── application/
│       └── adapters/
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

**Prohibido**: `feature → infra` (R1), `platform → feature` (R2), `shared → feature` (R3), `shared → infra` (R4), `domain → infra` (R5), `domain → platform` (R6), `infra → feature` (R7), cross-feature (R8), ciclos (R9)

### Convenciones de nomenclatura

| Elemento | Formato | Ejemplo |
|---|---|---|
| Directorios | `kebab-case/` | `credit-card/`, `event-bus/` |
| Archivos | `<PascalCase>.<artefacto>.ts` | `User.entity.ts` |
| Interfaces | `I<PascalCase>.<artefacto>.ts` | `IUser.repository.ts` |
| Use cases | `<Action>.uc.ts` | `CreateUser.uc.ts` |
| Clases | `PascalCase` | `UserController` |
| Funciones | `camelCase` | `formatDate` |

Ver `reference/patterns.md` para el detalle completo.

---

## Características clave

- **4 dominios arquitectónicos**: Platform (backbone), Features (negocio), Shared (código puro), Infra (implementaciones)
- **Architecture graph como fuente de verdad**: 6 tipos de nodo (platform, feature, shared, infra, domain, adapter), 9 reglas (R1-R9), risk score y dependency health
- **Ownership automático**: Detección de huérfanos, duplicados, componentes mal ubicados y sugerencias de reubicación
- **Scoring arquitectónico**: 110 puntos en 6 categorías, normalizado a 0-100 con grado A-F
- **5 perfiles tecnológicos predefinidos**: Express + MongoDB, Express + PostgreSQL, Express + Prisma, Fastify + Prisma, NestJS + Prisma
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
| `fastify-postgres` | Fastify | PostgreSQL | Prisma | Manual |
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
| `scripts/graph.mjs` | Grafo completo: 6 tipos de nodo, 4 capas, 9 reglas (R1-R9), risk score, dependency health |
| `scripts/chain.mjs` | Grafo multi-capa (platform, features, shared, infra) con orden topológico |
| `scripts/detect.mjs` | 6 categorías de chequeo arquitectónico (110 pts) |
| `scripts/inspect.mjs` | Orquesta auditoría completa con reporte coloreado |
| `scripts/architecture.mjs` | Genera/actualiza `ARCHITECTURE.md` vivo |
| `scripts/bootstrap.mjs` | Inicializa platform/shared/infra según perfil (interno) |
| `reference/` | Documentación detallada de cada comando y principios |
| `reference/patterns.md` | Convenciones de nomenclatura globales |
| `profiles/` | Convenciones por stack tecnológico |
| `templates/feature/` | Templates TypeScript para features |
| `templates/platform/` | Templates para componentes de platform |
| `templates/shared/` | Templates para shared (errors, contracts, types, utils) |
| `templates/infra/` | Templates para infra (prisma, mongodb, redis, mail) |

---

## Instalación

### En un proyecto

```bash
npx @ronaldjdev/forge install
```

Esto copia la skill en `.opencode/skills/forge/` del proyecto actual.

### Global (disponible en todos los proyectos)

```bash
npx @ronaldjdev/forge install --global
```

Esto copia la skill en `~/.config/opencode/skills/forge/`.

### Con instalación global del CLI

```bash
npm install -g @ronaldjdev/forge
forge install      # proyecto actual
forge install -g   # global
```

**Requisitos**: Node.js ≥ 18

---

## Uso

Una vez instalada, OpenCode carga automáticamente la skill `forge` al trabajar en el proyecto. Los comandos se invocan por lenguaje natural:

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

---

## Desarrollo

```bash
git clone <repo>
cd forge
npm install     # instala dependencias de desarrollo
```

La skill se referencia desde `.opencode/skills/forge/` como symlink a `skills/forge/`, por lo que cualquier cambio se refleja inmediatamente.


---

## Licencia

Apache-2.0

---

## Autor

**Ronald J. Echeverry** — [@ronaldjdev](https://github.com/ronaldjdev)
