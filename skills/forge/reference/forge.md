# Forge

Inicializa un proyecto para trabajar con Forge como Backend Architecture Operating System.

## Cuándo usarlo

- Proyecto nuevo sin estructura definida
- Proyecto existente sin `ARCHITECTURE.md`
- Después de clonar un repositorio
- Para bootstrappear los layers Platform, Shared e Infrastructure

## Flujo

1. Ejecutar `scripts/context.mjs` para detectar stack actual (incluye platform, features, shared, infra)
2. Ejecutar `scripts/bootstrap.mjs` para crear layers faltantes (platform, shared, infra)
3. Ejecutar `scripts/profile.mjs` para determinar perfil tecnológico
4. Ejecutar `scripts/armorer.mjs` para detectar ownership y huérfanos
5. Ejecutar `scripts/graph.mjs` para construir grafo arquitectónico global
6. Ejecutar `scripts/chain.mjs` para analizar dependencias multi-capa
7. Si `ARCHITECTURE.md` no existe, crearlo con `forge inscribe`
8. Si faltan dependencias clave (según perfil), listarlas
9. Si el proyecto tiene código legacy, sugerir `forge relocate`
10. Si el proyecto está listo, sugerir `forge cast`

## Output esperado

- `ARCHITECTURE.md` creado en la raíz del proyecto
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
