# Temper

Templa la arquitectura aplicando reglas de inyección de dependencias, seguridad y consistencia.

## Cuándo usarlo

- El proyecto tiene código legacy con DI manual que necesita migrar a contenedor
- Se detectaron violaciones de inyección de dependencias
- El proyecto usa strings como tokens de DI
- Hay container.resolve() esparcido en la lógica de negocio

## Reglas de DI

### Universal (aplica a cualquier perfil)

| Regla | Severidad |
|---|---|
| Siempre inyección por constructor | ERROR |
| Sin service locators | ERROR |
| Sin singletons globales | WARNING |
| Sin new de dependencias en clases inyectadas | WARNING |

### Para perfiles con tsyringe

- `@injectable()` en toda clase con dependencias
- `@inject(Token)` con tokens de clase, nunca strings
- `container.resolve()` solo en bootstrap (app.ts, routes)
- `container.registerSingleton()` para interfaces en app.ts
- `container.registerInstance()` para mocks en tests

### Para DI manual

- Crear instancias explícitamente en bootstrap
- Pasar dependencias por constructor
- Usar factories o functions para lazy initialization

### Para NestJS

- Usar `@Injectable()` de NestJS
- Configurar módulos con `providers` y `exports`
- Usar `@InjectRepository()` para TypeORM

## Prohibiciones

- ❌ `container.resolve()` dentro de use cases, entities o adapters
- ❌ `new UseCase(dep1, dep2)` en features migrados a contenedor
- ❌ Importar tsyringe en archivos de dominio
- ❌ Mezclar DI manual y contenedor en el mismo feature
- ❌ Proxies automáticos o decoradores ocultos que dificulten el rastreo
