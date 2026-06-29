# Assay

Genera un **ensayo arquitectónico multi-persona** que evalúa el estado actual de la arquitectura desde 5 perspectivas expertas.

## Cuándo usarlo

- Después de `forge inspect` para obtener interpretación cualitativa de los resultados
- Para entender el impacto de las violaciones desde ángulos complementarios
- Para priorizar acciones de refactor con criterio multi-disciplinario
- Como herramienta de discusión en revisiones arquitectónicas de equipo

## Las 5 Personas

| Persona | Rol | Enfoque |
|---------|-----|---------|
| **Jeff Bezos** | Arquitecto de Escalabilidad y Autonomía | Acoplamiento entre features, contratos de API, autonomía de equipos, ciclos de dependencias |
| **Martin Fowler** | Refinador de Patrones y Deuda Técnica | Dirección de dependencias, code smells, naming, refactoring evolutivo |
| **El Hacker** | Pragmático y Simplificador | Over-engineering, complejidad innecesaria, abstracciones sin valor, costo real de mantenimiento |
| **Alex** | Product Manager Técnico | Velocidad de entrega, ROI de la deuda técnica, impacto en roadmap, time-to-market |
| **Dra. Carter** | Arquitecta Senior — Deuda Técnica y Gobernanza | Sostenibilidad a 3-5 años, consistencia entre equipos, gobernanza y ownership |

## Uso

```bash
# Ensayo completo con todas las personas
node .opencode/skills/forge/scripts/assay.mjs

# Solo la opinión de una persona
node .opencode/skills/forge/scripts/assay.mjs --persona=bezos
node .opencode/skills/forge/scripts/assay.mjs --persona=fowler
node .opencode/skills/forge/scripts/assay.mjs --persona=hacker
node .opencode/skills/forge/scripts/assay.mjs --persona=pm
node .opencode/skills/forge/scripts/assay.mjs --persona=senior

# Salida JSON (para consumo por herramientas)
node .opencode/skills/forge/scripts/assay.mjs --json

# Persistir ensayo en .forge/assay/
node .opencode/skills/forge/scripts/assay.mjs --save

# Ver historial de ensayos
node .opencode/skills/forge/scripts/assay.mjs history

# Leer un ensayo previo
node .opencode/skills/forge/scripts/assay.mjs read assay-2026-06-25T00-00-00.md
```

## Formato de salida

```
═══ Forge Assay — Ensayo Arquitectónico ═══
Score: 72/140 (51%) — D
Violaciones: 8
Personas: Jeff Bezos, Martin Fowler, El Hacker, Alex, Dra. Carter
Fecha: 2026-06-25

──── Jeff Bezos — Arquitecto de Escalabilidad y Autonomía ────
...

──── Martin Fowler — Refinador de Patrones y Deuda Técnica ────
...

──── El Hacker — Pragmático y Simplificador ────
...

──── Alex — Product Manager Técnico ────
...

──── Dra. Carter — Arquitecta Senior ────
...
```

## Integración con inspect

El ensayo se basa en los datos del último `forge inspect`. Si no hay auditoría previa, el ensayo se genera igual pero con menos datos contextuales.

Se recomienda:
1. `forge inspect` → obtener score, violaciones, grafo
2. `forge assay` → interpretar los resultados desde las 5 perspectivas
3. Priorizar acciones basado en las recomendaciones
4. Refactorizar con `reforge`, `temper`, o `smelt`
5. Repetir el ciclo

## Ver también

- `reference/inspect.md` — el reporte que alimenta el ensayo
- `reference/adr.md` — ADRs como insumo para las opiniones de cada persona
- `reference/principles.md` — principios contra los que assay contrasta las decisiones
