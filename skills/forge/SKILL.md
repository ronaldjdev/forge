---
name: forge
description: >
  Architecture Operating System especializado en diseñar, construir, auditar,
  proteger y evolucionar arquitecturas backend escalables basadas en features
  (vertical slices), hexagonal architecture y DDD pragmático. Triggers:
  "arquitectura", "migrar", "refactorizar", "features", "hexagonal",
  "puertos y adaptadores", "clean architecture", "cast", "inspect",
  "quench", "chain". Excluye infraestructura (Docker, CI/CD),
  optimización de queries y cambios de lógica de negocio sin reestructuración.
---

# Forge — Architecture OS

Forge es un **sistema operativo arquitectónico**. Diseña, construye, audita, protege y evoluciona arquitecturas backend. Opera sobre cualquier stack moderno combinando **Arquitectura Hexagonal**, **DDD pragmático** y **vertical slices**.

No es un template ni una guía. Es un orquestador.

---

## Architecture Guidance

Ver `reference/principles.md` para el manifiesto completo y los 10 principios inquebrantables. En esencia:

| Principio | Regla |
|---|---|
| Unidades autónomas | Cada feature es dueño de su dominio, aplicación y adapters |
| Dependencias unidireccionales | adapters → application → domain → (nada) |
| Cero lógica en controllers | El controller parsea, delega y responde |
| Cero BD fuera de repositorios | Los repositories son la única puerta a datos |
| DI disciplinada | Constructor injection, sin service locators |
| Cero acoplamiento directo entre features | Siempre vía interfaces inyectadas |

---

## Setup Flow (OBLIGATORIO — ejecutar siempre antes de responder)

ANTES de cualquier acción, Forge DEBE ejecutar esta secuencia. Si no lo haces, puedes dar respuestas incorrectas:

1. Leer `ARCHITECTURE.md` desde la raíz del proyecto si existe (contexto persistente)
2. Ejecutar `node .opencode/skills/forge/scripts/context.mjs` → detectar stack, features, estado
3. Ejecutar `node .opencode/skills/forge/scripts/profile.mjs` → determinar perfil tecnológico
4. Si NO existe `ARCHITECTURE.md`, preguntar al usuario si desea crearlo con `forge`
5. Si el proyecto no tiene `src/features/`, detectar features legacy con `scripts/detect.mjs`
6. Ejecutar `node .opencode/skills/forge/scripts/dependencies.mjs` → grafo de dependencias
7. Guardar todo en `ctx` (variable de contexto local para esta conversación)
8. Determinar qué comandos están disponibles según el estado del proyecto
9. Recién ahora procesar el comando del usuario o preguntar

```bash
# Template de setup que debes ejecutar:
ctx=$(node .opencode/skills/forge/scripts/context.mjs --json 2>/dev/null)
profile=$(node .opencode/skills/forge/scripts/profile.mjs 2>/dev/null)
deps=$(node .opencode/skills/forge/scripts/dependencies.mjs 2>/dev/null)
```

---

## Command Routing

| Lenguaje natural | Comando | Archivo |
|---|---|---|
| "inicializar", "setup", "empezar" | `forge` | `reference/forge.md` |
| "crear feature", "nuevo dominio" | `cast` | `reference/cast.md` |
| "inspeccionar", "diagnóstico", "evaluar" | `inspect` | `reference/inspect.md` |
| "trasladar", "mover", "reestructurar feature" | `relocate` | `reference/relocate.md` |
| "refactorizar", "rediseñar", "cambiar estructura" | `reforge` | `reference/reforge.md` |
| "verificar", "quench", "checklist" | `quench` | `reference/quench.md` |
| "templar", "endurecer", "mejorar" | `temper` | `reference/temper.md` |
| "cadena", "grafo", "acoplamiento" | `chain` | `reference/chain.md` |
| "inscribir", "grabar", "ARCHITECTURE.md" | `inscribe` | `reference/inscribe.md` |
| "fundir", "compartir", "mover a shared" | `smelt` | `reference/smelt.md` |

---

## Execution Flow

Para cada comando, Forge sigue este flujo:

1. **Contexto**: Leer `ARCHITECTURE.md` + salida de `context.mjs`
2. **Perfil**: Cargar perfil activo desde `profiles/<profile>.md`
3. **Referencia**: Cargar `reference/<command>.md`
4. **Ejecutar**: Aplicar el flujo definido en la referencia, usando los scripts según corresponda
5. **Post**: Ejecutar `scripts/detect.mjs` para verificar que no se introdujeron violaciones
6. **Actualizar ARCHITECTURE.md**: Reflejar el nuevo estado
7. **Reportar**: Mostrar resultado al usuario con severidades

---

## Routing Rules

- Si el lenguaje natural matchea exactamente un comando, ejecutarlo directamente.
- Si hay ambigüedad, preguntar al usuario: "¿Quieres decir: cast, relocate o reforge?"
- Si el comando requiere un perfil que no está detectado, preguntar antes de continuar.
- Si el proyecto no tiene `src/features/` y el comando es `cast`, sugerir `forge` primero.
- Si `ARCHITECTURE.md` está desactualizado (fecha de auditoría > 7 días), sugerir `forge inscribe`.
- Todos los resultados se muestran con severidades: `[CRITICAL]`, `[ERROR]`, `[WARNING]`, `[INFO]`, `[SUGGESTION]`.

## ARCHITECTURE.md

Forge mantiene un archivo `ARCHITECTURE.md` en la raíz del proyecto con el contexto persistente. Creado por `forge`, actualizado automáticamente después de cada comando.

```md
# Architecture

Project Name: <name>
Framework: <detectado>
Runtime: <detectado>
Database: <detectado>
ORM: <detectado>
DI Strategy: <detectado>
Architecture: hexagonal-feature
Feature Convention: PascalCase
Active Profile: <detectado>
Last Audit: <fecha> (score: <puntaje>)
Migrated Features: [<lista>]
Legacy Features: [<lista>]
```

El agente DEBE leer este archivo al inicio de cada interacción y actualizarlo al finalizar cada comando.

---

## Module Index

| Módulo | Propósito |
|---|---|
| `reference/principles.md` | Manifiesto y 10 principios inquebrantables |
| `profiles/` | Perfiles tecnológicos detallados (Express, Fastify, NestJS, etc.) |
| `scripts/` | Scripts de análisis: context, architecture, audit, detect, dependencies, profile |
| `templates/feature/` | Templates de código (.ts.md) para entidades, use cases, controllers, etc. |
| `command/forge.md` | Definición del comando `/forge` para opencode |
