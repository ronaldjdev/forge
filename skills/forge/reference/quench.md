# Quench

Valida que el proyecto cumpla las reglas arquitectónicas.

## Cuándo usarlo

- Después de migrar un feature
- Después de crear un feature con `forge cast`
- Después de refactorizar con `forge reforge`
- Pre-commit o pre-deploy

## Reglas de capas (detect.mjs)

Estas reglas verifican la estructura de código dentro de cada feature (imports entre capas, lógica en controllers, acceso a BD). Se ejecutan vía `scripts/detect.mjs`:

| Regla | Severidad | Descripción |
|---|---|---|
| Domain no importa adapters | CRITICAL | Domain solo importa de domain (nada más) |
| Application no importa adapters | ERROR | Application solo importa de domain y shared |
| Sin container.resolve() en use cases | ERROR | El contenedor solo se usa en bootstrap |
| Sin lógica de negocio en controllers | ERROR | Controllers solo parsean, delegan y responden |
| Sin BD directa fuera de repositorios | ERROR | Repositories son la única puerta a datos |
| Sin imports directos entre features | WARNING | Comunicación via interfaces inyectadas |
| DI consistente dentro del feature | WARNING | No mezclar manual + contenedor en el mismo feature |
| Tests pasando | ERROR | Tests deben pasar después de cualquier cambio |

## Reglas del grafo arquitectónico (R1-R14)

Estas reglas verifican las dependencias entre capas en el grafo arquitectónico. Se ejecutan vía `scripts/graph.mjs` y `scripts/registry/rules.mjs`:

| Código | Regla | Severidad | Descripción |
|---|---|---|---|
| R1 | feature → infra | CRITICAL | Feature no importa infraestructura directamente |
| R2 | platform → feature | CRITICAL | Platform no importa features |
| R3 | shared → feature | CRITICAL | Shared no importa features |
| R4 | shared → infra | CRITICAL | Shared no importa infraestructura |
| R5 | domain → infra | CRITICAL | Domain no importa infraestructura |
| R6 | domain → platform | ERROR | Domain no importa platform |
| R7 | infra → feature | ERROR | Infra no importa features |
| R8 | feature → feature | ERROR | Sin imports directos entre features |
| R9 | Ciclo de dependencias | ERROR | Ciclo detectado en el grafo |
| R10 | Bare specifier en imports | ERROR | Imports locales deben usar ./ o @/ (detect.mjs) |
| R11 | Extensión .ts en imports | ERROR | Imports deben usar extensión .js (detect.mjs) |
| R12 | Import a bootstrap.di.js | ERROR | Usar ./di.js del feature (detect.mjs) |
| R12b | registerSingleton con model() | WARNING | Usar register({ useValue }) con Mongoose (detect.mjs) |
| R13 | Platform con lógica dominio | CRITICAL | Platform no contiene entidades, UCs, mappers |
| R14 | shared → domain | CRITICAL | Shared no importa domain de features |

El grafo se construye automáticamente con `{{AGENT_PATH}}/scripts/graph.mjs` y las violaciones se incluyen en `{{AGENT_PATH}}/scripts/detect.mjs` (categoría `graph`).

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
node {{AGENT_PATH}}/scripts/detect.mjs

# Solo errores y críticos
node {{AGENT_PATH}}/scripts/detect.mjs --severity ERROR

# Solo un tipo específico
node {{AGENT_PATH}}/scripts/detect.mjs --type layers

## Ver también

- `reference/evolutionary-architecture.md` — fitness functions como validación continua
- `reference/hooks.md` — integración de quench en pre-commit hook
```
