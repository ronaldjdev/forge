---
description: Forge — Backend Architecture OS. Subcomandos: forge, cast, inspect, relocate, reforge, quench, temper, chain, inscribe, smelt.
agent: build
---

Ejecuta herramientas de Forge según el subcomando especificado en $ARGUMENTS.

## Build

### forge

Inicializa el proyecto arquitectónicamente (incluye platform, shared, infra).

```
node .opencode/skills/forge/scripts/context.mjs
node .opencode/skills/forge/scripts/bootstrap.mjs
node .opencode/skills/forge/scripts/armorer.mjs
```

### cast

Crea un nuevo feature (verifica platform/shared/infra primero).

### relocate

Migra un feature existente.

### inscribe

Genera ARCHITECTURE.md con grafo arquitectónico, ownership y platform.

```
node .opencode/skills/forge/scripts/architecture.mjs
```

### architecture

Construye el grafo arquitectónico del proyecto (4 capas: platform, feature, shared, infra).

```
node .opencode/skills/forge/scripts/graph.mjs
```

Para salida JSON:

```
node .opencode/skills/forge/scripts/graph.mjs --json
```

### smelt

Extrae código reutilizable a shared/.

### bootstrap

Inicializa platform, shared e infra layers (interno, se ejecuta automáticamente).

```
node .opencode/skills/forge/scripts/bootstrap.mjs
```

## Evaluate

### inspect

Inspecciona la conformidad arquitectónica (incluye ownership y platform).

```
node .opencode/skills/forge/scripts/inspect.mjs
```

Para salida JSON:

```
node .opencode/skills/forge/scripts/inspect.mjs --json
```

### quench

Verifica reglas arquitectónicas.

```
node .opencode/skills/forge/scripts/detect.mjs
```

### chain

Analiza dependencias multi-capa (platform, features, shared, infra).

```
node .opencode/skills/forge/scripts/chain.mjs
```

### armorer

Detecta ownership, huérfanos, duplicados y mal ubicados.

```
node .opencode/skills/forge/scripts/armorer.mjs
```

## Refine

### reforge

Refactoriza la arquitectura de un feature.

### temper

Fortalece la arquitectura (DI, seguridad, consistencia).
