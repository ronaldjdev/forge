---
description: Forge — Architecture OS. Subcomandos: forge, cast, inspect, relocate, reforge, quench, temper, chain, inscribe, smelt.
agent: build
---

Ejecuta herramientas de Forge según el subcomando especificado en $ARGUMENTS.

## Build

### forge

Inicializa el proyecto arquitectónicamente.

```
node .opencode/skills/forge/scripts/context.mjs
```

### cast

Crea un nuevo feature.

### relocate

Migra un feature existente.

### inscribe

Genera ARCHITECTURE.md.

```
cat > ARCHITECTURE.md << 'EOF'
# Architecture

Project Name: ...
EOF
```

### smelt

Extrae código reutilizable a shared/.

## Evaluate

### inspect

Inspecciona la conformidad arquitectónica.

```
node .opencode/skills/forge/scripts/audit.mjs
```

Para salida JSON:

```
node .opencode/skills/forge/scripts/audit.mjs --json
```

### quench

Verifica reglas arquitectónicas.

```
node .opencode/skills/forge/scripts/detect.mjs
```

### chain

Analiza dependencias entre features.

```
node .opencode/skills/forge/scripts/dependencies.mjs
```

## Refine

### reforge

Refactoriza la arquitectura de un feature.

### temper

Fortalece la arquitectura (DI, seguridad, consistencia).
