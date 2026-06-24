# Smelt

Extrae código reutilizable desde features hacia `shared/`.

## Cuándo usarlo

- Dos o más features usan el mismo tipo, interfaz o utility
- Un feature contiene lógica que no es de negocio y podría ser compartida
- Se detecta duplicación de código entre features
- Se necesita mover un tipo o utilidad a `shared/` para mantener el principio DRY

## Flujo

1. Identificar el código candidato a extraer
2. Verificar que no tenga dependencias de infraestructura
3. Verificar que no tenga lógica de negocio específica de un feature
4. Mover el código a `src/shared/<category>/`:
   - Tipos → `src/shared/types/`
   - Interfaces → `src/shared/contracts/`
   - Errores → `src/shared/errors/`
   - Utilidades → `src/shared/utils/`
5. Actualizar todos los imports en los features que lo usaban
6. Ejecutar `forge quench` para verificar que no hay violaciones
7. Actualizar `ARCHITECTURE.md`

## Reglas

- El código extraído NO debe importar de features
- El código extraído NO debe importar de infraestructura
- El código extraído debe ser puro o depender solo de otros componentes shared
- Si el código depende de platform, considerar moverlo a platform en lugar de shared
