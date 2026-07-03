---
description: Forge — Backend Architecture OS. Comandos: forge, cast, inspect, assay, quench, chain, graph, armorer, inscribe, smelt, relocate, reforge, temper.
agent: build
---

Ejecuta herramientas de Forge según el subcomando especificado en $ARGUMENTS.

Si el subcomando NO tiene flags en $ARGUMENTS y tiene flags disponibles (ver tabla abajo), pregunta al usuario cuáles quiere usar con la `question` tool (tipo checkboxes múltiples). Si el usuario no selecciona ninguna, ejecuta sin flags.

| Comando | Flags disponibles |
|---------|------------------|
| `forge` | `--force` |
| `cast` | Sin flags (pide nombre del feature interactivamente) |
| `inspect` | `--json`, `--diff`, `--full`, `--summary`, `--severity=<nivel>`, `--force` |
| `assay` | `--persona=<id>`, `--json`, `--save`, `history` |
| `quench` | `--fix`, `--auto`, `--show-ignores`, `--severity=<nivel>`, `--json` |
| `chain` | `--json` |
| `graph` | `--json` |
| `armorer` | Sin flags |
| `inscribe` | `--output=<path>` |
| `smelt` | Sin flags (pide qué extraer interactivamente) |
| `relocate` | Sin flags (pide feature y destino) |
| `reforge` | `--cycles` |
| `temper` | Sin flags |

## Build

### forge

Inicializa el proyecto arquitectónicamente con configuración persistente.

1. `node {{AGENT_PATH}}/scripts/context.mjs` — detectar stack actual
2. `node {{AGENT_PATH}}/scripts/bootstrap.mjs` — crear platform/, shared/, infra/
3. Crear `src/features/` — si no existe
4. `node {{AGENT_PATH}}/scripts/forge-config.mjs --init` — crear `.forge/config.json` + `.forge/state.json`
5. `node {{AGENT_PATH}}/scripts/forge-config.mjs --update` — detectar y persistir perfil
6. Verificar `tsconfig.json` — agregar `experimentalDecorators` y `emitDecoratorMetadata` si falta
7. `node {{AGENT_PATH}}/scripts/armorer.mjs` — ownership
8. `node {{AGENT_PATH}}/scripts/graph.mjs` — grafo arquitectónico
9. `node {{AGENT_PATH}}/scripts/chain.mjs` — dependencias multi-capa
10. `node {{AGENT_PATH}}/scripts/detect.mjs --summary` — auditoría base
11. `node {{AGENT_PATH}}/scripts/architecture.mjs` — generar `ARCHITECTURE.md`

### cast

Crea un nuevo feature. Primero verifica que platform/shared/infra existan; si falta, llama a bootstrap.

### relocate

Migra un feature existente. Puede targetizar platform/, shared/, infra/ o features/.

### inscribe

Genera ARCHITECTURE.md con grafo arquitectónico, ownership y platform.

```
node {{AGENT_PATH}}/scripts/architecture.mjs
```

### graph

Construye el grafo arquitectónico del proyecto (4 capas: platform, feature, shared, infra) con reglas R1-R9.

```
node {{AGENT_PATH}}/scripts/graph.mjs
```

Para salida JSON:

```
node {{AGENT_PATH}}/scripts/graph.mjs --json
```

### smelt

Extrae código reutilizable a shared/ (solo código puro, sin dependencias infra/feature).

### bootstrap

Inicializa platform, shared e infra layers (uso interno, se ejecuta automáticamente).

```
node {{AGENT_PATH}}/scripts/bootstrap.mjs
```

## Evaluate

### inspect

Audita la conformidad arquitectónica completa. 6 categorías: structure(20), layers(20), ownership(20), platform(15), dependencies(15), graph(20).

```
node {{AGENT_PATH}}/scripts/inspect.mjs
```

Para salida JSON:

```
node {{AGENT_PATH}}/scripts/inspect.mjs --json
```

### assay

Ensayo arquitectónico multi-persona. Interpretación cualitativa del audit desde 5 perspectivas (Bezos, Fowler, Hacker, PM, Arquitecta Senior).

```
node {{AGENT_PATH}}/scripts/assay.mjs
```

Filtros:

```
node {{AGENT_PATH}}/scripts/assay.mjs --persona=bezos
node {{AGENT_PATH}}/scripts/assay.mjs --json
node {{AGENT_PATH}}/scripts/assay.mjs --save
node {{AGENT_PATH}}/scripts/assay.mjs history
```

### quench

Valida reglas arquitectónicas R1-R9.

```
node {{AGENT_PATH}}/scripts/detect.mjs
```

### chain

Orden topológico de dependencias multi-capa (platform, features, shared, infra).

```
node {{AGENT_PATH}}/scripts/chain.mjs
```

Para salida JSON:

```
node {{AGENT_PATH}}/scripts/chain.mjs --json
```

### armorer

Reporte de ownership: huérfanos, duplicados, componentes mal ubicados.

```
node {{AGENT_PATH}}/scripts/armorer.mjs
```

## Refine

### reforge

Refactoriza la arquitectura de un feature considerando las 4 capas.

### temper

Fortalece la arquitectura: constructor injection, sin service locators.
