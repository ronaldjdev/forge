# Quench

Valida que el proyecto cumpla las reglas arquitectónicas.

## Cuándo usarlo

- Después de migrar un feature
- Después de crear un feature con `forge cast`
- Después de refactorizar con `forge reforge`
- Pre-commit o pre-deploy

## Reglas críticas

| Regla | Código | Severidad | Descripción |
|---|---|---|---|
| Domain no importa infraestructura | — | CRITICAL | Domain no puede importar adapters, setting ni infraestructura |
| Application no importa adapters | — | ERROR | Application solo importa de domain y shared |
| Sin container.resolve() en use cases | — | ERROR | El contenedor solo se usa en bootstrap |
| Sin lógica de negocio en controllers | — | ERROR | Controllers solo parsean, delegan y responden |
| Sin BD directa fuera de repositorios | — | ERROR | Repositories son la única puerta a datos |
| Sin imports directos entre features | — | WARNING | Comunicación via interfaces inyectadas |
| DI consistente dentro del feature | — | WARNING | No mezclar manual + contenedor en el mismo feature |
| Tests pasando | — | ERROR | Tests deben pasar después de cualquier cambio |

## Reglas del grafo arquitectónico

| Código | Regla | Severidad | Descripción |
|---|---|---|---|
| R1 | core → feature | CRITICAL | Core nunca debe depender de features |
| R2 | domain → infra | CRITICAL | Domain no puede importar infraestructura |
| R3 | feature → infra (directo) | CRITICAL | Features no acceden infraestructura sin adapter |
| R4 | feature → feature (directo) | ERROR | Features no se importan directamente entre sí |
| R5 | Ciclo de dependencias | ERROR | Ciclo detectado en el grafo de features |
| R6 | infra → domain/feature | WARNING | Infraestructura no debe importar dominio interno |

El grafo se construye automáticamente con `scripts/graph.mjs` y las violaciones se incluyen en `scripts/detect.mjs` (categoría `graph`).

## Checklist pre-migración

- [ ] Dependencias del perfil instaladas (tsyringe, reflect-metadata, etc.)
- [ ] Decoradores habilitados en tsconfig (si aplica)
- [ ] Entry point configurado
- [ ] Orden topológico definido
- [ ] Dependencias de cada feature identificadas

## Checklist post-migración (por feature)

- [ ] @injectable() en use cases, controller y repository
- [ ] @inject() con tokens de clase (no strings)
- [ ] Sin container.resolve() en lógica de negocio
- [ ] Imports actualizados (sin referencias legacy)
- [ ] Archivo .di.ts legacy eliminado
- [ ] Controller usa arrow-methods
- [ ] Use case tiene un único execute()
- [ ] Repository implementa la interfaz del dominio
- [ ] Mapper tiene toDomain() y toPersistence()
- [ ] Routes/index.ts actualizado
- [ ] Tests migrados y pasando
- [ ] pnpm lint pasa
- [ ] pnpm build pasa
- [ ] pnpm test pasa

## Ejecución

```bash
# Validación completa
node .opencode/skills/forge/scripts/detect.mjs

# Solo errores y críticos
node .opencode/skills/forge/scripts/detect.mjs --severity ERROR

# Solo un tipo específico
node .opencode/skills/forge/scripts/detect.mjs --type layers

## Ver también

- `reference/evolutionary-architecture.md` — fitness functions como validación continua
- `reference/hooks.md` — integración de quench en pre-commit hook
```
