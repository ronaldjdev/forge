# Forge

Inicializa un proyecto para trabajar con Forge.

## Cuándo usarlo

- Proyecto nuevo sin estructura definida
- Proyecto existente sin `ARCHITECTURE.md`
- Después de clonar un repositorio

## Flujo

1. Ejecutar `scripts/context.mjs` para detectar stack actual (incluye grafo arquitectónico)
2. Ejecutar `scripts/profile.mjs` para determinar perfil tecnológico
3. Ejecutar `scripts/graph.mjs` para construir grafo arquitectónico
4. Si `ARCHITECTURE.md` no existe, crearlo con `forge inscribe` (incluye sección de grafo)
5. Si faltan dependencias clave (según perfil), listarlas
6. Si el proyecto tiene código legacy, sugerir `forge relocate`
7. Si el proyecto está limpio, sugerir `forge cast`

## Output esperado

- `ARCHITECTURE.md` creado en la raíz del proyecto
- Perfil tecnológico detectado y registrado
- Dependencias base verificadas
- Próximos pasos sugeridos según el estado del proyecto

## Severidades

| Condición | Severidad |
|---|---|
| Sin `src/` directory | ERROR |
| Sin `package.json` | ERROR |
| Sin perfil detectable | WARNING |
| Sin `ARCHITECTURE.md` | INFO |
| Dependencias faltantes | WARNING |
