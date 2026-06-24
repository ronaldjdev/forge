# Forge — Architecture OS

**Forge** es un sistema operativo arquitectónico para backend. Diseña, construye, audita, protege y evoluciona arquitecturas combinando **Arquitectura Hexagonal**, **DDD pragmático** y **vertical slices** como skill para [OpenCode](https://opencode.ai).

## Instalación

### En un proyecto

```bash
npx @ronaldjdev/forge install
```

Esto copia la skill en `.opencode/skills/forge/` del proyecto actual.

### Global (disponible en todos los proyectos)

```bash
npx @ronaldjdev/forge install --global
```

Esto copia la skill en `~/.config/opencode/skills/forge/`.

### Con instalación global del CLI

```bash
npm install -g @ronaldjdev/forge
forge install      # proyecto actual
forge install -g   # global
```

## Uso

Una vez instalada, OpenCode carga automáticamente la skill `forge` al trabajar en el proyecto. Los comandos disponibles son:

| Lenguaje natural | Comando |
|---|---|
| "inicializar", "setup", "empezar" | `forge` |
| "crear feature", "nuevo dominio" | `cast` |
| "inspeccionar", "diagnóstico", "evaluar" | `inspect` |
| "trasladar", "mover", "reestructurar feature" | `relocate` |
| "refactorizar", "rediseñar" | `reforge` |
| "verificar", "quench", "checklist" | `quench` |
| "templar", "endurecer", "mejorar" | `temper` |
| "cadena", "grafo", "acoplamiento" | `chain` |
| "inscribir", "grabar", "ARCHITECTURE.md" | `inscribe` |
| "fundir", "compartir", "mover a shared" | `smelt` |

## Desarrollo

```bash
git clone <repo>
cd forge
npm install     # instala dependencias de desarrollo
```

La skill se referencia desde `.opencode/skills/forge/` como symlink a `skills/forge/`, por lo que cualquier cambio se refleja inmediatamente.

## Licencia

Apache-2.0
