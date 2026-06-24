<img src="logo.png" alt="Forge Logo" width="300" height="300">

# Forge — Architecture OS

**Forge** es un **sistema operativo arquitectónico** para backend. Diseña, construye, audita, protege y evoluciona arquitecturas escalables combinando **Arquitectura Hexagonal**, **DDD pragmático** y **vertical slices**.

No es un template ni una guía. Es un orquestador que opera sobre cualquier stack moderno como skill para [OpenCode](https://opencode.ai).

---

## ¿Qué problema resuelve?

Los proyectos backend suelen empezar con buena estructura pero degeneran en código acoplado y spaghetti a medida que crecen. Forge impone una disciplina arquitectónica **auditable, automatizada y evolutiva** que:

- Mantiene el dominio aislado de infraestructura
- Previene acoplamiento directo entre features
- Automatiza la creación, migración y refactorización de vertical slices
- Produce un **architecture graph** como fuente de verdad
- Genera y mantiene `ARCHITECTURE.md` vivo

---

## ¿Cuándo usar Forge?

| Escenario | Comando | Descripción |
|-----------|---------|-------------|
| **Proyecto nuevo** | `forge` | Inicializa la estructura, detecta stack, crea `ARCHITECTURE.md` |
| **Crear un nuevo dominio** | `cast` | Genera un feature completo desde cero (domain, application, adapters) |
| **Auditar arquitectura** | `inspect` | Evaluación completa con scoring 0-100 y grado A-F |
| **Migrar código legacy** | `relocate` | Traslada features de estructura plana a vertical slices en orden topológico |
| **Refactorizar features** | `reforge` | Reestructura features sin cambiar lógica de negocio |
| **Validar reglas** | `quench` | Verifica 14+ reglas críticas (capas, DI, BD, imports) |
| **Endurecer DI** | `temper` | Aplica inyección por constructor, elimina service locators |
| **Analizar dependencias** | `chain` | Grafo de dependencias entre features, orden topológico, detección de ciclos |
| **Documentar automáticamente** | `inscribe` | Genera/actualiza `ARCHITECTURE.md` con métricas y violaciones |
| **Extraer código compartido** | `smelt` | Mueve código duplicado a `src/shared/` (errores, utils, types, middleware) |

---

## Comandos en detalle

### `forge` — Inicialización

Detecta el stack tecnológico, determina el perfil activo y prepara el proyecto para trabajar con Forge. Crea `ARCHITECTURE.md` si no existe y sugiere los próximos pasos (`cast` si es proyecto nuevo, `relocate` si hay código legacy).

```bash
# Se invoca desde OpenCode con lenguaje natural:
# "inicializar proyecto", "setup", "empezar"
```

### `cast` — Crear feature

Crea un nuevo feature (vertical slice) con estructura hexagonal completa:

```
src/features/<name>/
├── domain/
│   └── <entity>.ts
├── application/
│   ├── use-cases/
│   └── mappers/
└── adapters/
    ├── controllers/
    ├── repositories/
    └── routes/
```

### `inspect` — Auditoría arquitectónica

Evalúa 6 categorías contra un máximo de 120 puntos:

| Categoría | Puntos | Qué mide |
|-----------|--------|----------|
| Structure | 30 | Organización de directorios y features |
| Layers | 25 | Respeto de dependencias unidireccionales |
| Decorators | 20 | Uso correcto de DI decorators |
| Legacy | 15 | Código legacy pendiente de migrar |
| Config | 10 | Configuración del proyecto |
| Graph | 20 | Salud del architecture graph |

**Resultado**: Score 0-100 con grado A-F y severidades por cada violación.

### `relocate` — Migración legacy

Migra features desde estructura plana (`src/domain/`, `src/application/`, `src/adapters/`) a la nueva estructura basada en features, respetando el orden topológico calculado por `chain`.

### `reforge` — Refactorización

Refactoriza la arquitectura interna de features existentes:
- Extraer lógica de negocio desde controllers a use cases
- Dividir features grandes (+20 use cases) en subfeatures
- Unificar features duplicados
- Resolver dependencias cíclicas

### `quench` — Validación

Ejecuta 8 reglas críticas + 6 reglas de grafo (R1-R6):

| Regla | Severidad |
|-------|-----------|
| Domain no importa infraestructura | CRITICAL |
| Sin `container.resolve()` en use cases | ERROR |
| Sin lógica de negocio en controllers | ERROR |
| Sin BD directa fuera de repositorios | ERROR |
| Sin imports directos entre features | ERROR |
| Inyección por constructor obligatoria | ERROR |
| Sin service locators | ERROR |
| Sin singletons globales | WARNING |

### `temper` — Endurecimiento de DI

Aplica reglas de inyección de dependencias según el perfil tecnológico. Para perfiles con tsyringe agrega decoradores `@injectable()` e `@inject()`. Para perfiles sin contenedor, implementa constructor injection manual.

### `chain` — Cadena de dependencias

Construye el grafo de dependencias entre features usando el algoritmo de Kahn para orden topológico. Detecta ciclos y determina el orden seguro de migración (features sin dependencias primero).

### `inscribe` — Documentación

Genera `ARCHITECTURE.md` con:
- Metadatos del proyecto (framework, DB, ORM, DI strategy)
- Perfil activo
- Features migrados y legacy
- Architecture graph
- Risk score y salud del grafo
- Último audit score

### `smelt` — Extracción a Shared

Identifica código duplicado o transversal en los features y lo extrae a `src/shared/`:

```
src/shared/
├── errors/        # Errores reutilizables (AppError, DomainError)
├── port/          # Puertos globales (ILogger, IHttpClient, IEmail)
├── utils/         # Utilidades puras (constants, crypto, date)
├── types/         # Tipos globales compartidos
└── middleware/    # Middleware transversal (auth, logging, error handler)
```

---

## Características clave

- **Architecture graph como fuente de verdad**: Escanea todos los archivos, clasifica nodos (core, feature, domain, infra, adapter), crea aristas desde imports reales y valida 6 reglas de grafo (R1-R6).
- **Scoring arquitectónico**: Sistema de puntuación 0-100 con grado A-F basado en 6 categorías objetivas.
- **5 perfiles tecnológicos predefinidos**: Adapta reglas, estructura y convenciones a Express + MongoDB, Express + PostgreSQL, Express + Prisma, Fastify + Prisma, NestJS + Prisma.
- **8 niveles de severidad**: CRITICAL, ERROR, WARNING, INFO, SUGGESTION con sugerencias de fix.
- **Orden topológico**: Algoritmo de Kahn para determinar orden de migración seguro.
- **Detección de acoplamiento cross-feature**: Identifica imports directos entre features que violan la arquitectura hexagonal.
- **Documentación automática**: `ARCHITECTURE.md` se actualiza solo después de cada operación.
- **Sin dependencias runtime**: Forge solo necesita Node ≥ 18. Todo el análisis corre con scripts ESM propios.

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
| `SKILL.md` | Orquestración principal — leída por OpenCode al cargar la skill |
| `scripts/context.mjs` | Detecta stack, features, grafo y estado del proyecto |
| `scripts/profile.mjs` | Matchea stack contra perfiles conocidos o sintetiza uno genérico |
| `scripts/graph.mjs` | Construye grafo completo: nodos, aristas, reglas R1-R6, risk score |
| `scripts/chain.mjs` | Grafo de dependencias entre features con orden topológico |
| `scripts/detect.mjs` | 6 categorías de chequeo arquitectónico (120 pts) |
| `scripts/inspect.mjs` | Orquesta auditoría completa con reporte coloreado |
| `scripts/architecture.mjs` | Genera/actualiza `ARCHITECTURE.md` |
| `reference/` | Documentación detallada de cada comando para el agente AI |
| `profiles/` | Convenciones por stack tecnológico |
| `templates/feature/` | Templates TypeScript para entidades, use cases, controllers, etc. |

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
| "trasladar", "mover", "reestructurar feature" | `relocate` |
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
