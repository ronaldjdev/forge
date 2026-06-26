# forge — Ayuda

## Uso
  forge <comando> [flags]

## Comandos

  forge               Inicializar proyecto (boot sequence completa)
  cast                Crear nuevo feature con estructura hexagonal
  inspect             Auditoría arquitectónica (110pts → 0-100)
  relocate            Migrar código legacy a features/platform/shared/infra
  reforge             Refactorizar arquitectura multi-capa
  quench              Validar reglas R1-R9 (--fix auto-corrige)
  temper              Endurecer inyección de dependencias
  chain               Grafo de dependencias multi-capa
  graph               Grafo arquitectónico con risk score
  inscribe            Generar/actualizar ARCHITECTURE.md
  smelt               Extraer código puro a shared/
  assay               Ensayo multi-persona (--persona=, --save)
  nail                Crear shortcut de navegación
  unnail              Eliminar shortcut de navegación
  forge state         Estado persistente post-auditoría
  forge hook          Git pre-commit hook
  forge api           Validación de contratos API
  forge rollback      Restauración de puntos de guardado
  forge update        Verificar actualizaciones

## Flags

  --fix               Auto-corregir violaciones (quench)
  --show-ignores      Mostrar inline ignores (quench)
  --persona=<id>      Filtrar ensayo por persona (assay)
  --save              Persistir ensayo en .forge/assay/ (assay)
  --json              Salida JSON (assay, forge state)

## Inline Ignores

  // forge-ignore-next-line
  // forge-ignore: R1
  // forge-ignore: R1, R8
