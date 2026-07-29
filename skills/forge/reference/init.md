# Init — Pre-Init Discovery + Inicialización

Inicializa un proyecto con Forge, **pero primero pregunta al usuario cómo desea operar** antes de cualquier migración de código.

## ⚠️ Gate 0: Pre-Init Discovery (OBLIGATORIO)

**NO ejecutar bootstrap ni migrar código hasta pasar el Pre-Init Discovery.**

Usar la herramienta `question` para preguntar al usuario:

### Ronda 1 (obligatoria — modelo operativo)

| Pregunta | Opciones | Persiste como |
|----------|----------|---------------|
| ¿Cuál es el modelo operativo del proyecto? | Modular Monolith / Bounded Contexts (DDD) / Microservices / No estoy seguro | `operatingModel` |
| ¿Cuántas personas o equipos trabajarán en el código? | 1-3 devs / 4-8 devs / 9+ devs / Múltiples equipos | `teamSize` |
| ¿Qué estrategia de base de datos prefieres? | Schema compartido / Schemas por feature / BD independientes / No estoy seguro | `dbStrategy` |
| ¿El proyecto es nuevo (greenfield) o existente (brownfield)? | Greenfield (nuevo) / Brownfield (existente con código legacy) | `projectType` |
| ¿Cómo quieres gestionar la inyección de dependencias? | Manual (factory functions, wiring en di.ts) / Decorators (@injectable + @inject, tsyringe/NestJS) / Lo que detecte el perfil | `diStrategy` |

### Ronda 2 (si aplica — solo si hay código legacy o dominios conocidos)

| Pregunta | Opciones |
|----------|----------|
| ¿Has identificado dominios de negocio o bounded contexts? | Sí (listarlos) / No (descubrimiento posterior con `forge inspect`) |
| ¿Necesitas migrar código legacy a la estructura de Forge? | Sí / No / No estoy seguro |

### Post-Discovery

Según las respuestas:
- Si `operatingModel = modular-monolith` → mostrar referencia `reference/modular-monolith.md`
- Si `operatingModel = bounded-contexts` → mostrar referencia `reference/bounded-contexts.md`
- Si `projectType = brownfield` o `hasLegacy = true` → informar que después del init puede usar `forge relocate` para migrar código legacy
- Si `teamSize = multiple-teams` → recomendar revisar `reference/bounded-contexts.md` para definir límites claros

**Persistir las respuestas en `.forge/config.json`**:
```json
{
  "operatingModel": "modular-monolith",
  "teamSize": "4-8",
  "dbStrategy": "schemas-per-feature",
  "projectType": "brownfield",
  "domains": [],
  "hasLegacyCode": true,
  "initCompleted": false
}
```

**No avanzar a inicialización sin confirmación explícita del usuario.**

---

## Flujo de Inicialización

Una vez confirmado el plan, ejecutar:

1. Ejecutar `{{AGENT_PATH}}/scripts/context.mjs` — detectar stack actual (incluye platform, features, shared, infra)
2. Ejecutar `{{AGENT_PATH}}/scripts/bootstrap.mjs` — crear layers faltantes (platform, shared, infra)
3. Crear `src/features/` — directorio de features si no existe
4. Ejecutar `{{AGENT_PATH}}/scripts/forge-config.mjs --init` — crear `.forge/config.json` + `.forge/state.json`
   - Las respuestas del Pre-Init Discovery ya deben estar persistidas en `.forge/config.json`
5. Ejecutar `{{AGENT_PATH}}/scripts/forge-config.mjs --update` — detectar y persistir perfil tecnológico
6. Verificar `tsconfig.json` — agregar `experimentalDecorators` y `emitDecoratorMetadata` si falta
7. Ejecutar `{{AGENT_PATH}}/scripts/armorer.mjs` — detectar ownership y huérfanos
8. Ejecutar `{{AGENT_PATH}}/scripts/graph.mjs` — construir grafo arquitectónico global
9. Ejecutar `{{AGENT_PATH}}/scripts/chain.mjs` — analizar dependencias multi-capa
10. Ejecutar `{{AGENT_PATH}}/scripts/detect.mjs --summary` — auditoría base
11. Ejecutar `{{AGENT_PATH}}/scripts/architecture.mjs` — generar `ARCHITECTURE.md`
12. Marcar `initCompleted: true` en `.forge/config.json`
13. Si el usuario indicó código legacy, sugerir `forge relocate` con el contexto del discovery
14. Si el proyecto está listo, sugerir `forge cast` para crear el primer feature

## Output esperado

- `ARCHITECTURE.md` creado en la raíz del proyecto
- `.forge/config.json` con perfil tecnológico + respuestas del Pre-Init Discovery persistidos
- `.forge/state.json` con estado inicial
- `src/features/` creado si no existía
- `tsconfig.json` con `experimentalDecorators` y `emitDecoratorMetadata` habilitados
- Layers Platform, Shared e Infrastructure creados si no existían
- Perfil tecnológico detectado y registrado
- Ownership analizado
- Dependencias base verificadas
- Próximos pasos sugeridos según las respuestas del discovery

## Ver también

- `reference/bounded-contexts.md` — identificación de contexts al inicializar
- `reference/modular-monolith.md` — decisión de estructura al iniciar proyecto
- `reference/principles.md` — principios que guían la inicialización
- `reference/evolutionary-architecture.md` — bootstrap como primer paso evolutivo
- `reference/relocate.md` — migrar código legacy después del init
