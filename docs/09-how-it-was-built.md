# 09 — Cómo se Construyó Forge

Narrativa del proceso de creación, paso a paso.

## Fase 1: La semilla (23 Jun 2026)

**Commit**: `27c2451` — "Initial commit: Forge Architecture OS skill"

Todo empezó con un SKILL.md de 132 líneas y 7 scripts básicos. La idea era simple: un agente de IA que entendiera arquitectura hexagonal y pudiera ayudar a mantenerla.

### Lo que existía al inicio

```
skills/forge/
├── SKILL.md              ← 132 líneas (modelo + routing)
├── scripts/
│   ├── audit.mjs         ← Auditoría básica (luego inspect)
│   ├── context.mjs       ← Detección de stack
│   ├── armorer.mjs       ← Ownership detection
│   ├── profile.mjs       ← Tech profile detection
│   ├── graph.mjs         ← Grafo arquitectónico
│   ├── chain.mjs         ← Dependency chain
│   └── bootstrap.mjs     ← Creación de capas
├── reference/            ← 10 docs de referencia
├── profiles/             ← 5 perfiles tech
└── command/forge.md      ← 1 solo comando
```

### Decisiones de diseño iniciales

1. **ESM puro** (.mjs) — Sin CommonJS, sin build step. Node >= 18.
2. **Sin dependencias runtime** — Solo `@clack/prompts` y `picocolors`.
3. **Cada script es standalone + importable** — Patrón `if (process.argv[1]...) main()`.
4. **Tests con `node:test`** — Sin Jest, sin Vitest, sin dependencias externas.

### El SKILL.md como orquestador

El SKILL.md no es solo documentación. Es el **orquestador** que el agente de IA ejecuta:

```markdown
## Setup Flow (OBLIGATORIO — ejecutar siempre antes de responder)

1. Leer ARCHITECTURE.md si existe
2. Ejecutar context.mjs para detectar stack
3. Ejecutar armorer.mjs para ownership
4. Ejecutar profile.mjs para tech profile
5. Ejecutar graph.mjs para grafo
6. Ejecutar chain.mjs para dependencias
```

Esta secuencia garantiza que el agente siempre tenga contexto completo antes de responder.

## Fase 2: La explosión (25 Jun 2026)

**Commit**: `6201236` — "v1.1.0 — AOS Evolution"

Un solo commit con **14 scripts nuevos**. Este fue el momento en que Forge dejó de ser un audit tool y se convirtió en un OS arquitectónico.

### Qué se agregó

- **Motor de reglas** (`registry/rules.mjs`): Reglas centralizadas R1-R9
- **Ensayo multi-persona** (`assay.mjs`): 5 perspectivas expertas
- **Hooks** (`posttool.mjs`, `hook.mjs`): Protección post/pre-escritura
- **Persistencia** (`forge-config.mjs`, `forge-state.mjs`): Estado entre sesiones
- **Utilidades** (`formatter.mjs`, `parse-imports.mjs`, `rename.mjs`): Infraestructura de soporte

### Por qué 14 scripts de golpe

La decisión fue consciente: mejoras incrementales habrían roto la coherencia del sistema. Un grafo sin reglas no sirve. Un hook sin un grafo no sirve. Todo estaba acoplado, así que todo se construyó junto.

## Fase 3: Multi-agente (28 Jun - 1 Jul 2026)

**Commits**: `30c5a82` (v1.2.0), `f6cd787` (v1.3.0-beta), `5dac76c` (v1.3.1)

Forge pasó de ser un skill para un solo agente a un sistema multi-agente.

### El problema que resolvió

Cada agente de IA tiene su propio sistema de skills:
- OpenCode: `.opencode/skills/`
- Claude Code: `.claude/skills/`
- Cursor: `.cursor/skills/`
- Codex CLI: `.agents/skills/`

Forge necesitaba instalarse en todos sin duplicar código. La solución: un **installer** (`src/cli.js`) que copia `skills/forge/` al directorio correcto y renderiza placeholders.

### El placeholder `{{AGENT_PATH}}`

```markdown
# En SKILL.md.template
Ejecutar `{{AGENT_PATH}}/scripts/inspect.mjs --json`

# Se renderiza como:
# OpenCode:  .opencode/skills/forge/scripts/inspect.mjs --json
# Claude:    .claude/skills/forge/scripts/inspect.mjs --json
# Cursor:    .cursor/skills/forge/scripts/inspect.mjs --json
```

## Fase 4: Hooks y protección (3 Jul 2026)

**Commit**: `fe2c3b3` — "v1.3.5 — R13 Platform Domain Guard"

Los hooks transformaron Forge de una herramienta reactiva a una **proactiva**.

### forgeSentinel (PostToolUse)

```
Agente escribe archivo
    ↓
forgeSentinel analiza el archivo
    ↓
¿Violaciones? → Muestra recordatorio (no bloquea)
```

### forgeSmith (preToolUse — Cursor)

```
Agente intenta escribir archivo
    ↓
forgeSmith analiza el resultado
    ↓
¿CRITICAL/ERROR? → DENIEGA la escritura
```

La diferencia clave: sentinel informa, smith **bloquea**.

## Fase 5: madurez (5 Jul - 26 Jul 2026)

**Commits**: v1.4.0 → v1.5.1

Las mejoras se enfocaron en:
- **Estructura**: Subdirectorios en adapters (`controllers/`, `routes/`, `repositories/`, `schemas/`)
- **DI**: `feature/di.ts` como fuente única de registro
- **Scoring**: Normalización a 100, fixes de categorías
- **Auto-fix**: `quench --fix` aplica correcciones automáticas
- **init**: `forge` como comando de inicialización completa

## Patrones de código que emergieron

### Scripts como CLIs + módulos

```javascript
// Cada script es ejecutable standalone:
if (process.argv[1] && process.argv[1].endsWith("inspect.mjs")) {
  main().catch(console.error);
}

// Y exportable para uso por otros scripts:
export { buildReport, printReport };
```

### Formato de check uniforme

```javascript
// Todas las funciones de check retornan:
{
  score: number,        // 0 a MAX
  checks: Array<{
    severity: string,   // CRITICAL | ERROR | WARNING | INFO | SUGGESTION
    label: string,
    pass: boolean,
    fix?: string,
    detail?: string
  }>
}
```

### Boot sequence como protocolo

```bash
# Cada comando empieza igual:
node scripts/context.mjs          # 1. Contexto
node scripts/armorer.mjs          # 2. Ownership
node scripts/profile.mjs          # 3. Profile
node scripts/graph.mjs --json     # 4. Grafo
node scripts/chain.mjs --json     # 5. Chain
node scripts/inspect.mjs --json   # 6. Audit
node scripts/architecture.mjs     # 7. Doc
# → Ejecutar comando del usuario
# → Actualizar ARCHITECTURE.md
```

## Lecciones aprendidas

1. **El grafo es el corazón** — Todo se deriva del grafo: scoring, ownership, violations, recommendations
2. **Los hooks son la barrera** — Sin hooks, las reglas son sugerencias. Con hooks, son obligatorias
3. **Los tests dan confianza** — 46 tests permiten cambios agresivos sin miedo
4. **La normalización importa** — Un score de 22/189 no significa lo mismo que 12/100
5. **Multi-agente es complejo** — Cada agente tiene sus propias convenciones de hooks, paths y configuración
