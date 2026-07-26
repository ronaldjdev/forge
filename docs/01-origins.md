# 01 — Orígenes de Forge

## El problema

Los proyectos backend degeneran. No por falta de talento, sino por falta de disciplina arquitectónica automatizada.

El patrón es siempre el mismo:

1. **Inicio limpio**: La estructura está bien, las capas se respetan, el dominio está separado de la infraestructura.
2. **Presión por entregar**: Se agrega un `if` rápido en el controller. Se llama al ORM directamente desde un use case. Se importa un feature desde otro feature.
3. **Acoplamiento silencioso**: Nadie detecta la violación. El código funciona. El PR se aprueba.
4. **Degeneración**: Meses después, el proyecto es un monolito acoplado donde nadie sabe qué importa de qué, qué es dominio y qué es infraestructura.

**Forge nace para automatizar la detección y prevención de esta degeneración.**

## Qué es Forge

Forge es un **Architecture Operating System** — un sistema operativo arquitectónico para backend.

No es un template. No es una guía. No es un linter genérico.

Es un **orquestador** que:

- **Modela** el sistema en 4 dominios arquitectónicos obligatorios
- **Construye** features con estructura hexagonal completa
- **Audita** el código con 14 reglas arquitectónicas automatizadas
- **Protege** el proyecto con hooks pre/post-escritura
- **Evoluciona** el sistema con recomendaciones contextuales

Opera como **skill** para agentes de IA (OpenCode, Claude, Cursor, Codex, Gemini), integrándose directamente en el flujo de desarrollo.

## El modelo mental

```
┌─────────────────────────────────────────────────┐
│                  FORGE OS                        │
│                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│   │  MODEL   │  │  BUILD   │  │  AUDIT   │     │
│   │          │  │          │  │          │     │
│   │ 4 layers │  │ cast     │  │ inspect  │     │
│   │ rules    │  │ bootstrap│  │ quench   │     │
│   │ graph    │  │ reforge  │  │ graph    │     │
│   └──────────┘  └──────────┘  └──────────┘     │
│                                                  │
│   ┌──────────┐  ┌──────────┐                    │
│   │ PROTECT  │  │ EVOLVE   │                    │
│   │          │  │          │                    │
│   │ sentinel │  │ assay    │                    │
│   │ smith    │  │ chain    │                    │
│   │ hook     │  │ inscribe │                    │
│   └──────────┘  └──────────┘                    │
└─────────────────────────────────────────────────┘
```

## Los 15 principios inquebrantables

Forge se basa en 15 principios documentados en `reference/principles.md`:

1. **Arquitectura hexagonal basada en features** — La unidad es el feature, no la capa técnica
2. **DDD ligero, sin sobreingeniería** — Pragmatismo sobre dogma
3. **Separación estricta dominio ↔ infraestructura** — La razón de ser de hexagonal
4. **Un feature es una unidad autónoma** — Todo vive dentro de `features/<name>/`
5. **Dependencias unidireccionales** — `adapters → application → domain → (nada)`
6. **Cero lógica de negocio en controllers** — Parsea, delega, responde
7. **Cero acceso a BD fuera de infraestructura** — Repositories son la única puerta
8. **Código explícito sobre código mágico** — Imports explícitos, DI por constructor
9. **Inyección de dependencias disciplinada** — Sin service locators
10. **Escalabilidad horizontal de features** — Nuevo feature = nuevo directorio
11. **El sistema es un grafo arquitectónico vivo** — Todo componente es un nodo tipado
12. **Cuatro dominios con ownership estricto** — Platform, Features, Shared, Infra
13. **Errores tipados en el dominio** — Clases explícitas, no `throw Error()` genéricos
14. **Tests como ciudadanos de primera clase** — 70% unit / 20% integration / 10% e2e
15. **Seguridad como infraestructura transversal** — Auth, rate limiting en platform

## Por qué "Architecture Operating System"

Un sistema operativo:
- **Gestiona recursos** → Forge gestiona capas arquitectónicas
- **Aísla procesos** → Forge aísla features entre sí
- **Impone reglas** → Forge impone R1-R14
- **Proporciona abstracciones** → Forge provee templates, perfiles, comandos
- **Monitorea el sistema** → Forge audita con inspect, protege con hooks

Forge no ejecuta tu aplicación. Gestiona tu arquitectura.
