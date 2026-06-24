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

11. **El sistema es un grafo arquitectónico vivo** — Todo componente es un nodo tipado (core, feature, domain, infra, adapter). Toda relación es un edge validado. Las violaciones son edges prohibidos. El grafo es la fuente de verdad del sistema y se regenera en cada auditoría. Riesgo y salud se derivan del grafo, no de opiniones.
