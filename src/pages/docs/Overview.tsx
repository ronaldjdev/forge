import { Link } from 'react-router-dom'

export function Overview() {
  return (
    <article className="space-y-8">
      <h1 className="font-display text-4xl text-ink">Forge</h1>
      <p className="text-light/80 leading-relaxed">
        Forge es un sistema operativo arquitectónico para backend. Modela, construye, audita, protege y evoluciona sistemas completos en cuatro dominios arquitectónicos: Platform, Features, Shared e Infrastructure. Opera como skill para <a href="https://opencode.ai" target="_blank" rel="noopener noreferrer" className="text-accent underline">OpenCode</a>.
      </p>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">¿Qué problema resuelve?</h2>
        <p className="text-light/80 leading-relaxed">
          Los proyectos backend degeneran en código acoplado porque la infraestructura técnica y las reglas de negocio se mezclan sin ownership claro. Forge impone una disciplina arquitectónica auditable, automatizada y evolutiva que:
        </p>
        <ul className="list-disc list-inside text-light/80 space-y-1">
          <li>Modela el sistema en 4 capas con ownership estricto</li>
          <li>Mantiene el dominio aislado de infraestructura</li>
          <li>Previene acoplamiento directo entre features</li>
          <li>Detecta automáticamente huérfanos, duplicados y componentes mal ubicados</li>
          <li>Produce un architecture graph como fuente de verdad con 9 reglas (R1-R9)</li>
          <li>Genera y mantiene ARCHITECTURE.md vivo</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">¿Cómo funciona?</h2>
        <p className="text-light/80 leading-relaxed">
          Forge se instala como skill en OpenCode. Cuando trabajas en un proyecto, Forge ejecuta una boot sequence de 9 pasos que analiza tu stack, detecta la estructura actual, construye un grafo arquitectónico, audita violaciones y genera documentación viva. Luego ejecuta el comando que solicitaste y actualiza el estado.
        </p>
        <div className="bg-surface border border-accent/10 rounded-lg p-4 space-y-2">
          <p className="text-accent font-display text-sm">Boot Sequence</p>
          <ol className="list-decimal list-inside text-light/70 text-sm space-y-1">
            <li>Detectar stack, platform, features, shared, infra y estado</li>
            <li>Analizar ownership, huérfanos, duplicados y mal ubicados</li>
            <li>Determinar perfil tecnológico activo</li>
            <li>Construir grafo arquitectónico global (4 capas + 9 reglas)</li>
            <li>Analizar dependencias multi-capa</li>
            <li>Auditoría completa con scoring 0-100</li>
            <li>Generar / actualizar ARCHITECTURE.md</li>
            <li>Ejecutar el comando solicitado</li>
            <li>Actualizar ARCHITECTURE.md con el nuevo estado</li>
          </ol>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Comandos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-accent/10">
                <th className="text-left py-2 px-3 text-accent font-display">Comando</th>
                <th className="text-left py-2 px-3 text-accent font-display">Propósito</th>
              </tr>
            </thead>
            <tbody className="text-light/80">
              {[
                ['forge', 'Inicializa el proyecto, detecta stack, crea ARCHITECTURE.md'],
                ['cast', 'Crea un nuevo feature con estructura hexagonal completa'],
                ['inspect', 'Audita la arquitectura con scoring 0-100 y grado A-F'],
                ['quench', 'Valida las 9 reglas arquitectónicas R1-R9 (--fix)'],
                ['chain', 'Analiza el grafo de dependencias multi-capa'],
                ['graph', 'Construye el grafo arquitectónico con risk score'],
                ['assay', 'Ensayo multi-persona para interpretación cualitativa'],
                ['relocate', 'Migra código legacy a su layer correcto'],
                ['reforge', 'Refactoriza la arquitectura multi-capa'],
                ['temper', 'Endurece la inyección de dependencias'],
                ['smelt', 'Extrae código reutilizable a shared/'],
                ['inscribe', 'Genera y mantiene ARCHITECTURE.md'],
                ['forge hook', 'Git pre-commit hook para validación arquitectónica'],
                ['forge state', 'Estado persistente post-auditoría'],
                ['nail / unnail', 'Shortcuts de navegación entre directorios'],
                ['forge api', 'Validación de contratos API'],
                ['forge rollback', 'Restaura puntos de guardado'],
                ['forge update', 'Verifica actualizaciones de Forge'],
              ].map(([cmd, desc]) => (
                <tr key={cmd} className="border-b border-white/5">
                  <td className="py-2 px-3 font-mono text-accent">{cmd}</td>
                  <td className="py-2 px-3">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Perfiles Tecnológicos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-accent/10">
                <th className="text-left py-2 px-3 text-accent font-display">Perfil</th>
                <th className="text-left py-2 px-3 text-accent font-display">Framework</th>
                <th className="text-left py-2 px-3 text-accent font-display">BD</th>
                <th className="text-left py-2 px-3 text-accent font-display">ORM</th>
                <th className="text-left py-2 px-3 text-accent font-display">DI</th>
              </tr>
            </thead>
            <tbody className="text-light/80">
              {[
                ['express-mongodb', 'Express', 'MongoDB', 'Mongoose', 'tsyringe'],
                ['express-postgres', 'Express', 'PostgreSQL', 'raw pg', 'Manual'],
                ['express-prisma', 'Express', 'PostgreSQL', 'Prisma', 'tsyringe'],
                ['express-drizzle', 'Express', 'PostgreSQL / MySQL / SQLite', 'Drizzle', 'Manual'],
                ['fastify-mongodb', 'Fastify', 'MongoDB', 'Mongoose', 'Manual'],
                ['fastify-postgres', 'Fastify', 'PostgreSQL', 'Prisma', 'Manual'],
                ['fastify-prisma', 'Fastify', 'Cualquier RDBMS', 'Prisma', 'Manual'],
                ['nestjs-mongodb', 'NestJS', 'MongoDB', 'Mongoose', 'NestJS DI'],
                ['nestjs-postgres', 'NestJS', 'PostgreSQL', 'TypeORM', 'NestJS DI'],
                ['nestjs-prisma', 'NestJS', 'Cualquier RDBMS', 'Prisma', 'NestJS DI'],
              ].map(([name, fw, db, orm, di]) => (
                <tr key={name} className="border-b border-white/5">
                  <td className="py-2 px-3 font-mono text-accent">{name}</td>
                  <td className="py-2 px-3">{fw}</td>
                  <td className="py-2 px-3">{db}</td>
                  <td className="py-2 px-3">{orm}</td>
                  <td className="py-2 px-3">{di}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex gap-4 pt-4">
        <Link to="/docs/instalacion" className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-dark text-sm font-display rounded hover:scale-105 transition-transform">
          Instalar Forge →
        </Link>
        <Link to="/docs/comandos" className="inline-flex items-center gap-2 px-4 py-2 border border-accent/30 text-accent text-sm font-display rounded hover:scale-105 transition-transform">
          Ver Comandos →
        </Link>
      </div>
    </article>
  )
}
