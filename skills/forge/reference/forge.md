# Forge

Inicializa un proyecto para trabajar con Forge como Backend Architecture Operating System.

## Cuándo usarlo

- Proyecto nuevo sin estructura definida
- Proyecto existente sin `ARCHITECTURE.md`
- Después de clonar un repositorio
- Para bootstrappear los layers Platform, Shared e Infrastructure

## Flujo

1. Ejecutar `scripts/context.mjs` — detectar stack actual (incluye platform, features, shared, infra)
2. Ejecutar `scripts/bootstrap.mjs` — crear layers faltantes (platform, shared, infra)
3. Crear `src/features/` — directorio de features si no existe
4. Ejecutar `forge-config.mjs --init` — crear `.forge/config.json` + `.forge/state.json`
5. Ejecutar `forge-config.mjs --update` — detectar y persistir perfil tecnológico
6. Verificar `tsconfig.json` — agregar `experimentalDecorators` y `emitDecoratorMetadata` si falta
7. Ejecutar `scripts/armorer.mjs` — detectar ownership y huérfanos
8. Ejecutar `scripts/graph.mjs` — construir grafo arquitectónico global
9. Ejecutar `scripts/chain.mjs` — analizar dependencias multi-capa
10. Ejecutar `detect.mjs --summary` — auditoría base
11. Ejecutar `architecture.mjs` — generar `ARCHITECTURE.md`
12. Si faltan dependencias clave (según perfil), listarlas
13. Si el proyecto tiene código legacy, sugerir `forge relocate`
14. Si el proyecto está listo, sugerir `forge cast`

## Output esperado

- `ARCHITECTURE.md` creado en la raíz del proyecto
- `.forge/config.json` con perfil tecnológico persistido
- `.forge/state.json` con estado inicial
- `src/features/` creado si no existía
- `tsconfig.json` con `experimentalDecorators` y `emitDecoratorMetadata` habilitados
- Layers Platform, Shared e Infrastructure creados si no existían
- Perfil tecnológico detectado y registrado
- Ownership analizado
- Dependencias base verificadas
- Próximos pasos sugeridos según el estado del proyecto

## Severidades

| Condición | Severidad |
|---|---|
| Sin `src/` directory | ERROR |
| Sin `package.json` | ERROR |
| Sin perfil detectable | WARNING |
| Sin `ARCHITECTURE.md` | INFO |
| Platform layer ausente | SUGGESTION |
| Dependencias faltantes | WARNING |
| Ownership con huérfanos | WARNING |

## Ver también

- `reference/bounded-contexts.md` — identificación de contexts al inicializar
- `reference/modular-monolith.md` — decisión de estructura al iniciar proyecto
- `reference/principles.md` — principios que guían la inicialización
- `reference/evolutionary-architecture.md` — bootstrap como primer paso evolutivo
