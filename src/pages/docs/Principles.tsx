export function Principles() {
  return (
    <article className="space-y-8">
      <h1 className="font-display text-4xl text-ink">Principios</h1>

      <blockquote className="border-l-2 border-accent pl-4 text-light/70 italic text-sm leading-relaxed">
        Forge es una disciplina arquitectónica, no un template. Nace de la convicción de que el código limpio no se escribe, se forja. Combina Arquitectura Hexagonal, DDD ligero (sin sobreingeniería) y vertical slices para producir sistemas donde cada dominio de negocio es dueño absoluto de su destino. La inyección de dependencias no es un detalle técnico: es la herramienta que garantiza que el dominio nunca se contamine de infraestructura.
      </blockquote>

      <div className="space-y-6">
        {[
          { num: '01', title: 'Arquitectura hexagonal basada en features', text: 'La unidad de organización es el feature, no la capa técnica. Cada dominio contiene su propio domain/, application/ y adapters/. Las capas existen dentro de cada feature, no al revés.' },
          { num: '02', title: 'DDD ligero, sin sobreingeniería', text: 'Usa la terminología y estructura de Domain-Driven Design (entidades, repositorios, casos de uso) pero sin la rigidez académica. No crees value objects donde basta un string. No fuerces aggregate roots donde una interfaz limpia resuelve el problema. Pragmatismo sobre dogma.' },
          { num: '03', title: 'Separación estricta entre dominio e infraestructura', text: 'El dominio no sabe qué framework, base de datos o servicios externos existen. Las interfaces (puertos) están en domain/. Las implementaciones (adapters) están en adapters/out/. Esta frontera es la razón de ser de la arquitectura hexagonal.' },
          { num: '04', title: 'Un feature es una unidad autónoma', text: 'Todo lo que pertenece a un dominio vive dentro de features/<name>/. Entidades, repositorios, casos de uso, controladores, rutas, esquemas, mappers, DTOs. Si un archivo importa código de otro feature fuera de su directorio, la separación está rota.' },
          { num: '05', title: 'Dependencias unidireccionales', text: 'La flecha apunta SIEMPRE hacia adentro: adapters → application → domain → (nada). Domain no importa nada. Application solo importa de domain y shared. Cualquier import que viole esto se rechaza en code review. No hay excepciones.' },
          { num: '06', title: 'Cero lógica de negocio en controladores', text: 'El controller parsea la request, llama al caso de uso, y responde. No valida reglas, no calcula montos, no decide flujos. Si hay un if con lógica de dominio en un controller, está en el lugar equivocado.' },
          { num: '07', title: 'Cero acceso a BD fuera de infraestructura', text: 'Los repositories son la ÚNICA puerta a la base de datos. Ningún use case, controller o servicio llama al ORM, toca esquemas o ejecuta queries directamente. Las operaciones de BD solo aparecen en los repositories.' },
          { num: '08', title: 'Código explícito sobre código mágico', text: 'Prefiere imports explícitos, inyección por constructor y tipos declarados sobre decoradores ocultos, proxies automáticos o registros implícitos. El código debe leerse de arriba a abajo y entender su flujo sin herramientas externas de análisis.' },
          { num: '09', title: 'Inyección de dependencias disciplinada', text: 'La inyección de dependencias es por constructor, sin service locators ni singletons globales. Si el proyecto es pequeño, DI manual basta. Si crece, usar el sistema de DI del framework o un contenedor externo. Nunca container.resolve() dentro de lógica de negocio.' },
          { num: '10', title: 'Escalabilidad horizontal de features', text: 'Agregar un nuevo feature NUNCA implica modificar un feature existente. Nuevo dominio = nuevo directorio features/<name>/, nuevos casos de uso, nuevos adapters. El acoplamiento entre features solo ocurre mediante inyección de interfaces, nunca con imports directos.' },
          { num: '11', title: 'El sistema es un grafo arquitectónico vivo', text: 'Todo componente es un nodo tipado (platform, feature, shared, infra, domain, adapter, application). Toda relación es un edge validado. Las violaciones son edges prohibidos. El grafo es la fuente de verdad del sistema y se regenera en cada auditoría. Riesgo, salud y ownership se derivan del grafo, no de opiniones.' },
          { num: '12', title: 'Cuatro dominios arquitectónicos con ownership estricto', text: 'Todo backend se modela en cuatro capas: Platform (backbone técnico), Features (negocio), Shared (código puro reutilizable) e Infrastructure (implementaciones concretas). Cada componente tiene un único propietario arquitectónico. Los huérfanos, duplicados y componentes mal ubicados se detectan automáticamente.' },
        ].map((p) => (
          <div key={p.num} className="flex gap-4">
            <span className="font-display text-accent text-lg shrink-0 w-8">{p.num}</span>
            <div className="space-y-1">
              <h3 className="font-display text-lg text-ink">{p.title}</h3>
              <p className="text-light/70 text-sm leading-relaxed">{p.text}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}
