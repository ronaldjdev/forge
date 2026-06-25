export function ArchitecturePage() {
  return (
    <article className="space-y-8">
      <h1 className="font-display text-4xl text-ink">Arquitectura</h1>
      <p className="text-light/80 leading-relaxed">
        Forge modela todo backend en cuatro dominios arquitectónicos obligatorios con ownership estricto y reglas de dependencia automatizadas.
      </p>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Las 4 Capas</h2>

        {[
          {
            name: 'Platform',
            color: 'text-blue-300',
            desc: 'Backbone técnico global. Infraestructura técnica compartida que sostiene a los features.',
            dirs: ['config/', 'server/', 'database/', 'http/', 'logger/', 'cache/', 'security/', 'events/', 'scheduler/', 'observability/', 'di/'],
            files: ['App.config.ts', 'Server.ts', 'Database.config.ts', 'Router.ts', 'Logger.config.ts', 'Container.ts', 'Tokens.ts'],
          },
          {
            name: 'Features',
            color: 'text-accent',
            desc: 'Capacidades de negocio. Cada feature es una vertical slice autónoma con su propio dominio, aplicación y adapters.',
            dirs: ['features/<name>/domain/', 'features/<name>/application/', 'features/<name>/adapters/'],
            files: ['<Name>.entity.ts', 'I<Name>.repository.ts', '<Action>.uc.ts', '<Name>.mapper.ts', '<Name>.controller.ts', '<Name>.routes.ts', '<Name>.repository.ts', '<Name>.schema.ts'],
          },
          {
            name: 'Shared',
            color: 'text-purple-300',
            desc: 'Componentes reutilizables puros. Sin dependencias de infraestructura ni de features.',
            dirs: ['shared/errors/', 'shared/contracts/', 'shared/types/', 'shared/utils/'],
            files: ['NotFoundError.ts', 'ValidationError.ts', 'IPaginatedResponse.ts', 'api.types.ts', 'formatDate.ts'],
          },
          {
            name: 'Infrastructure',
            color: 'text-gray-400',
            desc: 'Implementaciones concretas de servicios externos. La única capa que conoce detalles de BD, caché, mail, etc.',
            dirs: ['infra/prisma/', 'infra/mongodb/', 'infra/redis/', 'infra/mail/'],
            files: ['Prisma.client.ts', 'Mongo.config.ts', 'Redis.service.ts', 'Mail.service.ts'],
          },
        ].map((layer) => (
          <div key={layer.name} className="bg-surface border border-accent/10 rounded-lg p-6 space-y-3">
            <h3 className={`font-display text-xl ${layer.color}`}>{layer.name}</h3>
            <p className="text-light/70 text-sm">{layer.desc}</p>
            <div className="flex flex-wrap gap-2">
              {layer.dirs.map((d) => (
                <span key={d} className="text-xs px-2 py-1 bg-white/5 text-light/50 font-mono rounded">{d}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {layer.files.map((f) => (
                <span key={f} className="text-xs px-2 py-1 bg-accent/5 text-accent/70 font-mono rounded">{f}</span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Reglas de Dependencia</h2>
        <p className="text-light/80 text-sm">Las flechas muestran el flujo permitido de dependencias:</p>

        <div className="bg-surface border border-accent/10 rounded-lg p-6 space-y-4">
          <div>
            <h3 className="font-display text-sm text-green-400 uppercase tracking-wider mb-2">✓ Permitido</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-light/80">
              {['feature → platform', 'feature → shared', 'platform → infra', 'adapter → infra', 'feature → domain'].map((dep) => (
                <div key={dep} className="flex items-center gap-2">
                  <span className="text-green-400">→</span>
                  <span className="font-mono text-xs">{dep}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm text-red-400 uppercase tracking-wider mb-2">✗ Prohibido</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-accent/10">
                    <th className="text-left py-2 px-3 text-accent font-display">Regla</th>
                    <th className="text-left py-2 px-3 text-accent font-display">Dependencia</th>
                    <th className="text-left py-2 px-3 text-accent font-display">Severidad</th>
                  </tr>
                </thead>
                <tbody className="text-light/80">
                  {[
                    ['R1', 'feature → infra (directo)', 'CRITICAL'],
                    ['R2', 'platform → feature', 'CRITICAL'],
                    ['R3', 'shared → feature', 'ERROR'],
                    ['R4', 'shared → infra', 'ERROR'],
                    ['R5', 'domain → infra', 'CRITICAL'],
                    ['R6', 'domain → platform', 'CRITICAL'],
                    ['R7', 'infra → feature', 'WARNING'],
                    ['R8', 'Cross-feature direct imports', 'ERROR'],
                    ['R9', 'Ciclos de dependencia', 'ERROR'],
                  ].map(([code, dep, severity]) => (
                    <tr key={code} className="border-b border-white/5">
                      <td className="py-2 px-3 font-mono text-accent">{code}</td>
                      <td className="py-2 px-3 font-mono text-xs">{dep}</td>
                      <td className="py-2 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          severity === 'CRITICAL' ? 'bg-red-900/30 text-red-300' :
                          severity === 'ERROR' ? 'bg-orange-900/30 text-orange-300' :
                          'bg-yellow-900/30 text-yellow-300'
                        }`}>
                          {severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Boot Sequence</h2>
        <p className="text-light/80 text-sm">
          Antes de cualquier acción, Forge ejecuta esta secuencia obligatoria de 9 pasos para garantizar contexto completo:
        </p>
        <div className="space-y-3">
          {[
            { step: '01', name: 'context.mjs', desc: 'Detectar stack, platform, features, shared, infra, grafo y estado del proyecto' },
            { step: '02', name: 'armorer.mjs', desc: 'Analizar ownership, detectar huérfanos, duplicados y componentes mal ubicados' },
            { step: '03', name: 'profile.mjs', desc: 'Determinar perfil tecnológico activo (Express, Fastify, NestJS, etc.)' },
            { step: '04', name: 'graph.mjs', desc: 'Construir grafo arquitectónico global: 6 tipos de nodo, 4 capas, 9 reglas' },
            { step: '05', name: 'chain.mjs', desc: 'Analizar dependencias multi-capa con orden topológico' },
            { step: '06', name: 'inspect.mjs', desc: 'Auditoría completa con scoring 0-100, severidades y ownership' },
            { step: '07', name: 'architecture.mjs', desc: 'Generar / actualizar ARCHITECTURE.md con métricas y violaciones' },
            { step: '08', name: '—', desc: 'Ejecutar el comando solicitado por el usuario (cast, quench, temper, etc.)' },
            { step: '09', name: 'architecture.mjs', desc: 'Actualizar ARCHITECTURE.md para reflejar el nuevo estado' },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 items-start">
              <span className="font-display text-accent text-lg shrink-0 w-8">{item.step}</span>
              <div>
                <span className="font-mono text-sm text-ink">{item.name}</span>
                <p className="text-light/60 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Architecture Graph</h2>
        <p className="text-light/80 text-sm">
          Forge modela el sistema como un grafo arquitectónico vivo. Cada componente es un nodo tipado y cada relación es un edge validado contra las 9 reglas.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-accent/10">
                <th className="text-left py-2 px-3 text-accent font-display">Tipo de Nodo</th>
                <th className="text-left py-2 px-3 text-accent font-display">Ejemplos</th>
              </tr>
            </thead>
            <tbody className="text-light/80">
              {[
                ['platform', 'config, server, logger, di'],
                ['feature', 'users, payments, credit'],
                ['domain', 'users/domain, payments/domain'],
                ['adapter', 'users/adapters/http, credit/adapters/persistence'],
                ['shared', 'errors, contracts, types, utils'],
                ['infra', 'prisma, mongodb, redis, mail'],
              ].map(([type, examples]) => (
                <tr key={type} className="border-b border-white/5">
                  <td className="py-2 px-3 font-mono text-accent">{type}</td>
                  <td className="py-2 px-3 text-light/70">{examples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  )
}
