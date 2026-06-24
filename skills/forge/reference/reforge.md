# Reforge

Refactoriza la arquitectura de un feature o de un componente de platform/shared/infra.

## Cuándo usarlo

- Un feature tiene violaciones arquitectónicas
- Un feature legacy necesita reestructurarse
- Un componente de platform necesita refinarse
- Un componente de shared necesita rediseñarse
- El grafo arquitectónico muestra violaciones que requieren intervención

## Flujo básico

1. Ejecutar `forge inspect` para obtener estado actual
2. Identificar violaciones en el grafo arquitectónico
3. Identificar ownership problemático (huérfanos, duplicados, mal ubicados)
4. Decidir las acciones correctivas en orden:
   - Violaciones CRITICAL primero (R1, R2, R5, R6)
   - Violaciones ERROR después (R3, R4, R8, R9)
   - Ownership problemático
   - Warnings
5. Ejecutar cambios en el feature o componente
6. Ejecutar `forge quench` para verificar
7. Actualizar `ARCHITECTURE.md`

## Refactorización multi-capa

Reforge ahora considera las cuatro capas arquitectónicas:

- **Platform**: Mover componentes técnicos sueltos a `src/platform/`
- **Features**: Reestructurar features con violaciones
- **Shared**: Extraer código duplicado a `src/shared/`
- **Infra**: Organizar implementaciones concretas en `src/infra/`

## Post-refactorización

- `forge inspect` — confirmar mejora en puntuación
- `forge chain` — verificar que no se introdujeron ciclos
- `forge armorer` — verificar ownership saludable
