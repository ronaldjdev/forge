const commands: any[] = [
  {
    name: 'forge',
    subtitle: 'Inicialización del proyecto',
    use: ['Proyecto nuevo sin estructura definida', 'Proyecto existente sin ARCHITECTURE.md', 'Después de clonar un repositorio', 'Bootstrappear los layers Platform, Shared e Infrastructure'],
    flow: [
      'Ejecutar context.mjs para detectar stack actual',
      'Ejecutar bootstrap.mjs para crear layers faltantes',
      'Ejecutar profile.mjs para determinar perfil tecnológico',
      'Ejecutar armorer.mjs para detectar ownership y huérfanos',
      'Ejecutar graph.mjs para construir grafo arquitectónico',
      'Ejecutar chain.mjs para analizar dependencias multi-capa',
      'Crear ARCHITECTURE.md con forge inscribe si no existe',
      'Listar dependencias faltantes según el perfil',
      'Sugerir forge relocate si hay código legacy',
      'Sugerir forge cast si el proyecto está listo',
    ],
    output: 'ARCHITECTURE.md creado, layers creados, perfil detectado, ownership analizado, próximos pasos sugeridos.',
  },
  {
    name: 'cast',
    subtitle: 'Crear un nuevo feature',
    use: ['Agregar un nuevo dominio de negocio', 'El dominio no existe previamente en forma legacy'],
    flow: [
      'Verificar que src/platform/, src/shared/, src/infra/ existan (crearlos si no)',
      'Determinar el nombre del feature en kebab-case',
      'Crear estructura: domain/, application/use-cases/, application/mappers/, adapters/in/http/, adapters/out/persistence/',
      'Generar entity, repository interface, mapper, schema, repository, use cases, controller, routes',
      'Registrar rutas en el enrutador principal',
      'Ejecutar forge quench para verificar el feature',
      'Actualizar ARCHITECTURE.md',
    ],
    output: 'Feature completo con estructura hexagonal, rutas registradas, verificación aprobada.',
  },
  {
    name: 'inspect',
    subtitle: 'Auditoría arquitectónica completa',
    use: ['Diagnóstico inicial del proyecto', 'Post-migración de feature', 'Pre-deploy para garantizar calidad', 'On demand para verificar estado'],
    categories: [
      { name: 'Estructura', pts: 30, desc: 'Features completos (domain, application, adapters)' },
      { name: 'Capas', pts: 25, desc: 'Imports prohibidos, lógica en controllers, BD directa' },
      { name: 'Decoradores', pts: 20, desc: '@injectable y @inject presentes donde corresponde' },
      { name: 'Legacy', pts: 15, desc: 'Archivos residuales en ubicaciones antiguas' },
      { name: 'Configuración', pts: 10, desc: 'tsconfig, dependencias, reflect-metadata' },
      { name: 'Grafo', pts: 20, desc: 'Violaciones arquitectónicas R1-R6, risk score, salud del grafo' },
    ],
    score: [
      { range: '90-100', grade: 'A', meaning: 'Arquitectura sólida. Cumple todos los principios.' },
      { range: '80-89', grade: 'B', meaning: 'Inconsistencias menores. Fáciles de corregir.' },
      { range: '65-79', grade: 'C', meaning: 'Varias violaciones. Requiere trabajo estructurado.' },
      { range: '50-64', grade: 'D', meaning: 'Arquitectura comprometida. Migración necesaria.' },
      { range: '0-49', grade: 'F', meaning: 'Proyecto no migrado o con violaciones generalizadas.' },
    ],
  },
  {
    name: 'quench',
    subtitle: 'Validación de reglas arquitectónicas',
    use: ['Después de migrar un feature', 'Después de crear un feature con forge cast', 'Después de refactorizar con forge reforge', 'Pre-commit o pre-deploy'],
    rules: [
      { code: 'R1', rule: 'feature → infra (prohibido)', severity: 'CRITICAL' },
      { code: 'R2', rule: 'platform → feature (prohibido)', severity: 'CRITICAL' },
      { code: 'R3', rule: 'shared → feature (prohibido)', severity: 'ERROR' },
      { code: 'R4', rule: 'shared → infra (prohibido)', severity: 'ERROR' },
      { code: 'R5', rule: 'domain → infra (prohibido)', severity: 'CRITICAL' },
      { code: 'R6', rule: 'domain → platform (prohibido)', severity: 'CRITICAL' },
      { code: 'R7', rule: 'infra → feature (prohibido)', severity: 'WARNING' },
      { code: 'R8', rule: 'Cross-feature direct imports', severity: 'ERROR' },
      { code: 'R9', rule: 'Ciclos de dependencia', severity: 'ERROR' },
    ],
  },
  {
    name: 'temper',
    subtitle: 'Endurecimiento de DI',
    use: ['Código legacy con DI manual que necesita migrar a contenedor', 'Violaciones de inyección de dependencias', 'Strings como tokens de DI', 'container.resolve() esparcido en lógica de negocio'],
    rules: [
      { text: 'Siempre inyección por constructor', severity: 'ERROR' },
      { text: 'Sin service locators', severity: 'ERROR' },
      { text: 'Sin singletons globales', severity: 'WARNING' },
      { text: 'Sin new de dependencias en clases inyectadas', severity: 'WARNING' },
    ],
  },
  {
    name: 'chain',
    subtitle: 'Cadena de dependencias multi-capa',
    use: ['Antes de migrar un feature', 'Cuando se detectan imports directos entre features', 'Para determinar orden topológico de migración', 'Para diagnosticar acoplamiento excesivo'],
    rules: [
      'Nunca imports directos entre features',
      'Comunicación entre features siempre vía interfaces inyectadas',
      'Un feature puede depender de otro, pero nunca al revés (sin ciclos)',
      'Interfaces compartidas se declaran en el feature que las define',
      'Dependencias transitivas se inyectan, no se heredan',
    ],
  },
  {
    name: 'relocate',
    subtitle: 'Migración de código legacy',
    use: ['Código legacy fuera de src/features/', 'Componentes legacy que deben migrarse a platform, shared o infra'],
    strategies: [
      { from: 'src/config/, src/setting/, src/middleware/', to: 'src/platform/<name>/', layer: 'Platform' },
      { from: 'src/application/use-cases/<name>/', to: 'src/features/<name>/', layer: 'Feature' },
      { from: 'src/utils/, src/helpers/, src/lib/', to: 'src/shared/<name>/', layer: 'Shared' },
      { from: 'src/database/, src/providers/', to: 'src/infra/<name>/', layer: 'Infra' },
    ],
  },
  {
    name: 'reforge',
    subtitle: 'Refactorización multi-capa',
    use: ['Un feature tiene violaciones arquitectónicas', 'Un componente de platform/shared/infra necesita refinarse', 'El grafo muestra violaciones que requieren intervención'],
    flow: [
      'Ejecutar forge inspect para estado actual',
      'Identificar violaciones en el grafo arquitectónico',
      'Identificar ownership problemático (huérfanos, duplicados, mal ubicados)',
      'Corregir violaciones CRITICAL primero (R1, R2, R5, R6)',
      'Corregir violaciones ERROR después (R3, R4, R8, R9)',
      'Resolver ownership problemático',
      'Ejecutar forge quench para verificar',
      'Actualizar ARCHITECTURE.md',
    ],
  },
  {
    name: 'inscribe',
    subtitle: 'Documentación ARCHITECTURE.md',
    use: ['Proyecto nuevo (crear ARCHITECTURE.md inicial)', 'Después de migrar un feature', 'Después de refactorizar', 'On demand'],
    fields: [
      { field: 'Framework', source: 'context.mjs' },
      { field: 'Database', source: 'context.mjs' },
      { field: 'ORM', source: 'context.mjs' },
      { field: 'DI Strategy', source: 'context.mjs' },
      { field: 'Active Profile', source: 'profile.mjs' },
      { field: 'Platform / Features / Shared / Infra', source: 'context.mjs' },
      { field: 'Ownership', source: 'armorer.mjs' },
      { field: 'Architecture Graph', source: 'graph.mjs' },
      { field: 'Risk Score', source: 'graph.mjs' },
      { field: 'Violations', source: 'graph.mjs' },
      { field: 'Last Audit', source: 'inspect.mjs' },
    ],
  },
  {
    name: 'smelt',
    subtitle: 'Extracción a Shared',
    use: ['Dos o más features usan el mismo tipo o utility', 'Un feature contiene lógica no de negocio compartible', 'Duplicación de código entre features'],
    categories: [
      { name: 'Tipos', dir: 'src/shared/types/' },
      { name: 'Interfaces', dir: 'src/shared/contracts/' },
      { name: 'Errores', dir: 'src/shared/errors/' },
      { name: 'Utilidades', dir: 'src/shared/utils/' },
    ],
  },
]

export function CommandsPage() {
  return (
    <article className="space-y-12">
      <h1 className="font-display text-4xl text-ink">Comandos</h1>
      <p className="text-light/80 leading-relaxed">
        Forge expone 10 comandos para modelar, construir, auditar y evolucionar la arquitectura de tu backend.
        Se invocan por lenguaje natural dentro de OpenCode.
      </p>

      {commands.map((cmd) => (
        <section key={cmd.name} id={`cmd-${cmd.name}`} className="space-y-4 scroll-mt-24">
          <h2 className="font-display text-2xl text-accent">
            <span className="text-light/40 font-mono text-base">/</span> {cmd.name}
            <span className="block text-sm text-light/50 font-mono font-normal mt-1">{cmd.subtitle}</span>
          </h2>

          <div className="space-y-2">
            <h3 className="font-display text-sm text-ink uppercase tracking-wider">Cuándo usarlo</h3>
            <ul className="list-disc list-inside text-light/80 text-sm space-y-1">
              {cmd.use.map((u: any) => <li key={u}>{u}</li>)}
            </ul>
          </div>

          {'flow' in cmd && (
            <div className="space-y-2">
              <h3 className="font-display text-sm text-ink uppercase tracking-wider">Flujo</h3>
              <ol className="list-decimal list-inside text-light/80 text-sm space-y-1">
                {cmd.flow!.map((step: any, i: number) => <li key={i}>{step}</li>)}
              </ol>
            </div>
          )}

          {'output' in cmd && (
            <div className="space-y-2">
              <h3 className="font-display text-sm text-ink uppercase tracking-wider">Output esperado</h3>
              <p className="text-light/80 text-sm">{cmd.output}</p>
            </div>
          )}

          {'rules' in cmd && cmd.rules && (
            <div className="space-y-2">
              <h3 className="font-display text-sm text-ink uppercase tracking-wider">Reglas</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-accent/10">
                      {'code' in cmd.rules[0] ? (
                        <>
                          <th className="text-left py-2 px-3 text-accent font-display">Código</th>
                          <th className="text-left py-2 px-3 text-accent font-display">Regla</th>
                          <th className="text-left py-2 px-3 text-accent font-display">Severidad</th>
                        </>
                      ) : (
                        <>
                          <th className="text-left py-2 px-3 text-accent font-display">Regla</th>
                          <th className="text-left py-2 px-3 text-accent font-display">Severidad</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="text-light/80">
                    {cmd.rules.map((r: any, i: number) => (
                      <tr key={i} className="border-b border-white/5">
                        {'code' in r ? (
                          <>
                            <td className="py-2 px-3 font-mono text-accent">{(r as any).code}</td>
                            <td className="py-2 px-3">{(r as any).rule}</td>
                            <td className="py-2 px-3">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                (r as any).severity === 'CRITICAL' ? 'bg-red-900/30 text-red-300' :
                                (r as any).severity === 'ERROR' ? 'bg-orange-900/30 text-orange-300' :
                                'bg-yellow-900/30 text-yellow-300'
                              }`}>
                                {(r as any).severity}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-3">{(r as any).text}</td>
                            <td className="py-2 px-3">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                (r as any).severity === 'ERROR' ? 'bg-orange-900/30 text-orange-300' :
                                'bg-yellow-900/30 text-yellow-300'
                              }`}>
                                {(r as any).severity}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {'categories' in cmd && 'pts' in cmd.categories[0] && (
            <div className="space-y-2">
              <h3 className="font-display text-sm text-ink uppercase tracking-wider">Categorías de evaluación</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-accent/10">
                      <th className="text-left py-2 px-3 text-accent font-display">Categoría</th>
                      <th className="text-left py-2 px-3 text-accent font-display">Pts</th>
                      <th className="text-left py-2 px-3 text-accent font-display">Qué mide</th>
                    </tr>
                  </thead>
                  <tbody className="text-light/80">
                    {cmd.categories.map((cat: any) => (
                      <tr key={cat.name} className="border-b border-white/5">
                        <td className="py-2 px-3">{cat.name}</td>
                        <td className="py-2 px-3 font-mono text-accent">{cat.pts}</td>
                        <td className="py-2 px-3">{cat.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {'score' in cmd && (
            <div className="space-y-2">
              <h3 className="font-display text-sm text-ink uppercase tracking-wider">Interpretación del score</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-accent/10">
                      <th className="text-left py-2 px-3 text-accent font-display">Rango</th>
                      <th className="text-left py-2 px-3 text-accent font-display">Nota</th>
                      <th className="text-left py-2 px-3 text-accent font-display">Significado</th>
                    </tr>
                  </thead>
                  <tbody className="text-light/80">
                    {cmd.score.map((s: any) => (
                      <tr key={s.grade} className="border-b border-white/5">
                        <td className="py-2 px-3 font-mono">{s.range}</td>
                        <td className="py-2 px-3 font-display text-accent text-lg">{s.grade}</td>
                        <td className="py-2 px-3">{s.meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {'strategies' in cmd && (
            <div className="space-y-2">
              <h3 className="font-display text-sm text-ink uppercase tracking-wider">Estrategias por layer</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-accent/10">
                      <th className="text-left py-2 px-3 text-accent font-display">Layer</th>
                      <th className="text-left py-2 px-3 text-accent font-display">Desde</th>
                      <th className="text-left py-2 px-3 text-accent font-display">Hacia</th>
                    </tr>
                  </thead>
                  <tbody className="text-light/80">
                    {cmd.strategies.map((s: any) => (
                      <tr key={s.layer} className="border-b border-white/5">
                        <td className="py-2 px-3 font-display text-accent">{s.layer}</td>
                        <td className="py-2 px-3 font-mono text-xs">{s.from}</td>
                        <td className="py-2 px-3 font-mono text-xs">{s.to}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {'fields' in cmd && (
            <div className="space-y-2">
              <h3 className="font-display text-sm text-ink uppercase tracking-wider">Campos auto-detectados</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-accent/10">
                      <th className="text-left py-2 px-3 text-accent font-display">Campo</th>
                      <th className="text-left py-2 px-3 text-accent font-display">Fuente</th>
                    </tr>
                  </thead>
                  <tbody className="text-light/80">
                    {cmd.fields.map((f: any) => (
                      <tr key={f.field} className="border-b border-white/5">
                        <td className="py-2 px-3">{f.field}</td>
                        <td className="py-2 px-3 font-mono text-xs text-accent">{f.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {'categories' in cmd && 'dir' in cmd.categories[0] && (
            <div className="space-y-2">
              <h3 className="font-display text-sm text-ink uppercase tracking-wider">Categorías shared</h3>
              <div className="grid grid-cols-2 gap-2">
                {cmd.categories.map((cat: any) => (
                  <div key={cat.name} className="bg-surface border border-accent/10 rounded p-3">
                    <p className="text-accent text-sm font-display">{cat.name}</p>
                    <p className="text-light/50 text-xs font-mono">{cat.dir}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ))}
    </article>
  )
}
