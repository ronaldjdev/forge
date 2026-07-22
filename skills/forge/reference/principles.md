# Principles

> Forge es una **disciplina arquitectónica**, no un template. Nace de la convicción de que el código limpio no se escribe, se forja. Combina **Arquitectura Hexagonal**, **DDD ligero** (sin sobreingeniería) y **vertical slices** para producir sistemas donde cada dominio de negocio es dueño absoluto de su destino. La inyección de dependencias no es un detalle técnico: es la herramienta que garantiza que el dominio nunca se contamine de infraestructura.

## Principios Inquebrantables

1. **Arquitectura hexagonal basada en features** — La unidad de organización es el feature, no la capa técnica. Cada dominio contiene su propio `domain/`, `application/` y `adapters/`. Las capas existen *dentro* de cada feature, no al revés.

2. **DDD ligero, sin sobreingeniería** — Usa la terminología y estructura de Domain-Driven Design (entidades, repositorios, casos de uso) pero sin la rigidez académica. No crees "value objects" donde basta un `string`. No fuerces aggregate roots donde una interfaz limpia resuelve el problema. Pragmatismo sobre dogma.

3. **Separación estricta entre dominio e infraestructura** — El dominio no sabe qué framework, base de datos o servicios externos existen. Las interfaces (puertos) están en `domain/`. Las implementaciones (adapters) están en `adapters/out/`. Esta frontera es la razón de ser de la arquitectura hexagonal.

4. **Un feature es una unidad autónoma** — Todo lo que pertenece a un dominio vive dentro de `features/<name>/`. Entidades, repositorios, casos de uso, controladores, rutas, esquemas, mappers, DTOs. Si un archivo importa código de otro feature fuera de su directorio, la separación está rota.

5. **Dependencias unidireccionales** — La flecha apunta SIEMPRE hacia adentro: `adapters → application → domain → (nada)`. Domain no importa nada. Application solo importa de domain y shared. Cualquier import que viole esto se rechaza en code review. No hay excepciones.

6. **Cero lógica de negocio en controladores** — El controller parsea la request, llama al caso de uso, y responde. No valida reglas, no calcula montos, no decide flujos. Si hay un `if` con lógica de dominio en un controller, está en el lugar equivocado.

7. **Cero acceso a BD fuera de infraestructura** — Los repositories son la ÚNICA puerta a la base de datos. Ningún use case, controller o servicio llama al ORM, toca esquemas o ejecuta queries directamente. Las operaciones de BD solo aparecen en los repositories.

8. **Código explícito sobre código mágico** — Prefiere imports explícitos, inyección por constructor y tipos declarados sobre decoradores ocultos, proxies automáticos o registros implícitos. El código debe leerse de arriba a abajo y entender su flujo sin herramientas externas de análisis.

9. **Inyección de dependencias disciplinada** — La inyección de dependencias es por constructor, sin service locators ni singletons globales. Si el proyecto es pequeño, DI manual basta. Si crece, usar el sistema de DI del framework o un contenedor externo. Nunca `container.resolve()` dentro de lógica de negocio.

10. **Escalabilidad horizontal de features** — Agregar un nuevo feature NUNCA implica modificar un feature existente. Nuevo dominio = nuevo directorio `features/<name>/`, nuevos casos de uso, nuevos adapters. El acoplamiento entre features solo ocurre mediante inyección de interfaces, nunca con imports directos entre features.

11. **El sistema es un grafo arquitectónico vivo** — Todo componente es un nodo tipado (platform, feature, shared, infra, domain, adapter, application). Toda relación es un edge validado. Las violaciones son edges prohibidos. El grafo es la fuente de verdad del sistema y se regenera en cada auditoría. Riesgo, salud y ownership se derivan del grafo, no de opiniones.

12. **Cuatro dominios arquitectónicos con ownership estricto** — Todo backend se modela en cuatro capas: Platform (backbone técnico), Features (negocio), Shared (código puro reutilizable) e Infrastructure (implementaciones concretas). Cada componente tiene un único propietario arquitectónico. Los huérfanos, duplicados y componentes mal ubicados se detectan automáticamente. Las reglas de dependencia entre capas son obligatorias: `feature → platform → infra`, `feature → shared`, `adapter → infra`. Las dependencias prohibidas incluyen: `feature → infra`, `feature → feature`, `platform → feature`, `shared → feature`, `shared → domain`, `shared → infra`, `domain → infra`, `domain → platform`, `infra → feature`. Cualquier violación es una degradación arquitectónica.

    **⚠️ Platform es exclusivamente backbone técnico.** Nunca debe contener entidades de dominio, casos de uso, mappers, repositorios de dominio, schemas de entidades, DTOs de negocio ni ninguna lógica con reglas de negocio. Si un archivo en `platform/` tiene sufijos `.entity.ts`, `.uc.ts`, `.mapper.ts`, `.port.ts` o importa desde `features/`, está mal ubicado. Esa lógica pertenece a `src/features/<name>/`. Violar esto introduce acoplamiento `platform → feature` (R2) y contamina el backbone técnico con lógica de dominio (R13).

13. **Errores tipados en el dominio** — Los errores de dominio son clases explícitas, no `throw Error()` genéricos. Viven en `shared/errors/` si son transversales o en `domain/` del feature si son específicos. Los adapters HTTP traducen errores de dominio a códigos HTTP. La capa de aplicación nunca sabe qué códigos HTTP existen. Ver `reference/errors.md`.

14. **Tests como ciudadanos de primera clase** — El dominio y los casos de uso se testean con unit tests sin infraestructura (mocks en las interfaces). Los adapters se testean con integration tests contra infraestructura real. La pirámide de tests es 70% unit / 20% integration / 10% e2e. Sin coverage de use cases no hay aprobación arquitectónica. Ver `reference/testing-patterns.md`.

15. **Seguridad como infraestructura transversal** — AuthN, AuthZ, rate limiting y validación son infraestructura, no dominio. Se implementan en `platform/security/` y `platform/http/` como middlewares. El dominio recibe `userId` o `role` si un caso de uso lo necesita, pero nunca implementa lógica de autenticación. Ver `reference/security-patterns.md` y `reference/api-design.md`.
