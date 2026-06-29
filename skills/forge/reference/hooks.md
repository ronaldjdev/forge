# Hook — Git pre-commit hook arquitectónico

## Propósito

Validar automáticamente la arquitectura del proyecto antes de cada commit,
bloqueando commits que introduzcan violaciones CRITICAL o ERROR en los
archivos staged.

## Uso

```bash
# Instalar el hook pre-commit
forge hook install

# Ver estado
forge hook status

# Ignorar una regla específica
forge hook ignore R1

# Dejar de ignorar
forge hook unignore R1

# Listar reglas ignoradas
forge hook list-ignored

# Ejecutar validación manual sobre staged files
forge hook check

# Desinstalar
forge hook uninstall
```

## Comportamiento

El hook ejecuta `detect.mjs` sobre los archivos staged con extensión
`.ts`, `.js`, `.mjs`, `.tsx`, `.jsx` dentro de `src/`. Si encuentra
violaciones de severidad CRITICAL o ERROR que afecten a archivos staged:

1. Muestra las violaciones con su severidad y fix sugerido
2. Bloquea el commit (exit code 1)
3. Sugiere cómo ignorar la regla si es necesario

El commit puede saltarse con `git commit --no-verify`.

## Archivos de configuración

| Archivo | Propósito |
|---------|-----------|
| `.forge/hooks-ignore.json` | Lista de reglas ignoradas por el hook |
| `.git/hooks/pre-commit` | Script instalado por `forge hook install` |

## Reglas ignoradas

Las reglas ignoradas se almacenan en `.forge/hooks-ignore.json`:

```json
{ "ignored": ["R1", "R7", "R9"] }
```

Cuando una regla está ignorada, el hook no bloquea el commit por
violaciones de esa regla, aunque el detector sigue reportándolas.

## Ver también

- `reference/quench.md` — validación que el hook ejecuta en pre-commit
- `reference/evolutionary-architecture.md` — fitness functions como hook
- `reference/adr.md` — ADRs como insumo para validación en hook
