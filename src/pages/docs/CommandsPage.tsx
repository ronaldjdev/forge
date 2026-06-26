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
      { name: 'Estructura', pts: 20, desc: 'Features completos (domain, application, adapters)' },
      { name: 'Capas', pts: 20, desc: 'Imports prohibidos, lógica en controllers, BD directa' },
      { name: 'Ownership', pts: 20, desc: 'Huérfanos, duplicados y componentes mal ubicados' },
      { name: 'Platform', pts: 15, desc: 'Configuración tsconfig, dependencias, reflect-metadata' },
      { name: 'Dependencias', pts: 15, desc: 'Violaciones R1-R9, acoplamiento entre features' },
      { name: 'Grafo', pts: 20, desc: 'Risk score, salud del grafo, ciclos de dependencia' },
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
    fix: 'quench soporta --fix para auto-corregir violaciones WARNING/INFO (missing @injectable(), tsconfig, naming, container.resolve).',
  },
  {
    name: 'graph',
    subtitle: 'Grafo arquitectónico y risk score',
    use: ['Diagnosticar el estado del grafo de dependencias', 'Obtener risk score del sistema', 'Visualizar violaciones arquitectónicas por nodo', 'Antes de una migración o refactor mayor'],
    nodeTypes: [
      { type: 'platform', example: 'config, server, logger, di' },
      { type: 'feature', example: 'users, payments, credit' },
      { type: 'domain', example: 'users/domain, payments/domain' },
      { type: 'adapter', example: 'users/adapters/http, credit/adapters/persistence' },
      { type: 'shared', example: 'errors, contracts, types, utils' },
      { type: 'infra', example: 'prisma, mongodb, redis, mail' },
    ],
  },
  {
    name: 'assay',
    subtitle: 'Ensayo arquitectónico multi-persona',
    use: ['Después de forge inspect para obtener interpretación cualitativa', 'Para evaluar el impacto de violaciones desde ángulos complementarios', 'Para priorizar acciones de refactor con criterio multi-disciplinario', 'En revisiones arquitectónicas de equipo'],
    personas: [
      { name: 'Jeff Bezos', role: 'Arquitecto de Escalabilidad', focus: 'Acoplamiento entre features, autonomía de equipos, contratos de API' },
      { name: 'Martin Fowler', role: 'Refinador de Patrones', focus: 'Dirección de dependencias, code smells, refactoring evolutivo' },
      { name: 'El Hacker', role: 'Pragmático', focus: 'Over-engineering, complejidad innecesaria, costo real de mantenimiento' },
      { name: 'Alex', role: 'Product Manager Técnico', focus: 'Velocidad de entrega, ROI de deuda técnica, time-to-market' },
      { name: 'Dra. Carter', role: 'Arquitecta Senior', focus: 'Sostenibilidad a 3-5 años, consistencia entre equipos, gobernanza' },
    ],
    flags: '--persona=<id>, --save, --json',
  },
  {
    name: 'forge state',
    subtitle: 'Estado persistente post-auditoría',
    use: ['Consultar el último estado auditado del proyecto', 'Verificar cuándo fue la última auditoría', 'Obtener score y violaciones sin re-ejecutar inspect'],
  },
  {
    name: 'forge hook',
    subtitle: 'Git pre-commit hook arquitectónico',
    use: ['Bloquear commits que introduzcan violaciones CRITICAL o ERROR', 'Automatizar validación arquitectónica en el flujo de trabajo', 'Integrar Forge en el pipeline de calidad del equipo'],
    subcommands: [
      { cmd: 'install', desc: 'Instalar el hook en .git/hooks/pre-commit' },
      { cmd: 'status', desc: 'Ver estado del hook' },
      { cmd: 'check', desc: 'Ejecutar validación manual sobre staged files' },
      { cmd: 'uninstall', desc: 'Desinstalar el hook' },
      { cmd: 'ignore R1', desc: 'Ignorar una regla específica' },
      { cmd: 'unignore R1', desc: 'Dejar de ignorar una regla' },
      { cmd: 'list-ignored', desc: 'Listar reglas ignoradas' },
    ],
  },
  {
    name: 'nail / unnail',
    subtitle: 'Shortcuts de navegación',
    use: ['Crear atajos a directorios de uso frecuente', 'Navegar rápidamente entre features durante una sesión'],
  },
  {
    name: 'forge api',
    subtitle: 'Validación de contratos API',
    use: ['Verificar consistencia entre rutas definidas y contratos OpenAPI', 'Detectar endpoints sin documentación', 'Validar tipos de request/response contra schemas'],
  },
  {
    name: 'forge rollback',
    subtitle: 'Restauración de puntos de guardado',
    use: ['Recuperar un estado anterior del proyecto', 'Deshacer cambios después de una migración fallida', 'Restaurar ARCHITECTURE.md a una versión previa'],
  },
  {
    name: 'forge update',
    subtitle: 'Verificar actualizaciones',
    use: ['Comprobar si hay una versión más reciente de Forge disponible', 'Mantener la skill actualizada'],
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
        Forge expone +10 comandos para modelar, construir, auditar, evaluar y evolucionar la arquitectura de tu backend.
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

          {'rules' in cmd && cmd.rules && typeof cmd.rules[0] === 'string' && (
            <div className="space-y-2">
              <h3 className="font-display text-sm text-ink uppercase tracking-wider">Reglas</h3>
              <ul className="list-disc list-inside text-light/80 text-sm space-y-1">
                {cmd.rules.map((r: any, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {'rules' in cmd && cmd.rules && typeof cmd.rules[0] === 'object' && (
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
                            <td className="py-2 px-3 font-mono text-accent">{r.code}</td>
                            <td className="py-2 px-3">{r.rule}</td>
                            <td className="py-2 px-3">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                r.severity === 'CRITICAL' ? 'bg-red-900/30 text-red-300' :
                                r.severity === 'ERROR' ? 'bg-orange-900/30 text-orange-300' :
                                'bg-yellow-900/30 text-yellow-300'
                              }`}>
                                {r.severity}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-3">{r.text}</td>
                            <td className="py-2 px-3">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                r.severity === 'ERROR' ? 'bg-orange-900/30 text-orange-300' :
                                'bg-yellow-900/30 text-yellow-300'
                              }`}>
                                {r.severity}
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

          {'fix' in cmd && (
            <div className="space-y-2">
              <h3 className="font-display text-sm text-ink uppercase tracking-wider">Auto-fix</h3>
              <div className="bg-surface border border-accent/10 rounded-lg p-4">
                <p className="text-light/80 text-sm">{cmd.fix}</p>
                <code className="block mt-2 text-sm text-accent">forge quench --fix</code>
              </div>
            </div>
          )}

          {'nodeTypes' in cmd && (
            <div className="space-y-2">
              <h3 className="font-display text-sm text-ink uppercase tracking-wider">Tipos de nodo</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-accent/10">
                      <th className="text-left py-2 px-3 text-accent font-display">Tipo</th>
                      <th className="text-left py-2 px-3 text-accent font-display">Ejemplos</th>
                    </tr>
                  </thead>
                  <tbody className="text-light/80">
                    {cmd.nodeTypes.map((n: any) => (
                      <tr key={n.type} className="border-b border-white/5">
                        <td className="py-2 px-3 font-mono text-accent">{n.type}</td>
                        <td className="py-2 px-3 text-sm text-light/70">{n.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {'personas' in cmd && (
            <div className="space-y-2">
              <h3 className="font-display text-sm text-ink uppercase tracking-wider">Las 5 personas</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-accent/10">
                      <th className="text-left py-2 px-3 text-accent font-display">Persona</th>
                      <th className="text-left py-2 px-3 text-accent font-display">Enfoque</th>
                    </tr>
                  </thead>
                  <tbody className="text-light/80">
                    {cmd.personas.map((p: any) => (
                      <tr key={p.name} className="border-b border-white/5">
                        <td className="py-2 px-3">
                          <span className="text-accent font-display">{p.name}</span>
                          <span className="block text-xs text-light/50">{p.role}</span>
                        </td>
                        <td className="py-2 px-3 text-sm">{p.focus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {'flags' in cmd && (
                <div className="bg-surface border border-accent/10 rounded-lg p-3 mt-2">
                  <p className="text-light/70 text-xs">
                    Flags: <code className="text-accent">{cmd.flags}</code>
                  </p>
                </div>
              )}
            </div>
          )}

          {'subcommands' in cmd && (
            <div className="space-y-2">
              <h3 className="font-display text-sm text-ink uppercase tracking-wider">Subcomandos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-accent/10">
                      <th className="text-left py-2 px-3 text-accent font-display">Comando</th>
                      <th className="text-left py-2 px-3 text-accent font-display">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="text-light/80">
                    {cmd.subcommands.map((s: any) => (
                      <tr key={s.cmd} className="border-b border-white/5">
                        <td className="py-2 px-3 font-mono text-xs text-accent">{s.cmd}</td>
                        <td className="py-2 px-3 text-sm">{s.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      ))}
      <section className="space-y-6">
        <h2 className="font-display text-2xl text-ink pt-8 border-t border-accent/10">Flags globales</h2>
        <p className="text-light/80 text-sm">
          Algunos comandos aceptan flags adicionales para controlar su comportamiento:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-accent/10">
                <th className="text-left py-2 px-3 text-accent font-display">Flag</th>
                <th className="text-left py-2 px-3 text-accent font-display">Comando</th>
                <th className="text-left py-2 px-3 text-accent font-display">Descripción</th>
              </tr>
            </thead>
            <tbody className="text-light/80">
              {[
                ['--fix', 'quench', 'Auto-corrige violaciones WARNING/INFO (@injectable, tsconfig, naming, container.resolve)'],
                ['--show-ignores', 'quench', 'Muestra los inline ignores encontrados en el código'],
                ['--persona=&lt;id&gt;', 'assay', 'Filtra ensayo por una persona (bezos, fowler, hacker, pm, senior)'],
                ['--save', 'assay', 'Persiste el ensayo en .forge/assay/'],
                ['--json', 'assay, forge state', 'Salida en formato JSON'],
              ].map(([flag, cmd, desc]) => (
                <tr key={flag} className="border-b border-white/5">
                  <td className="py-2 px-3 font-mono text-accent text-xs">{flag}</td>
                  <td className="py-2 px-3 font-mono text-xs text-light/50">{cmd}</td>
                  <td className="py-2 px-3 text-sm">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink pt-8 border-t border-accent/10">Inline Ignores</h2>
        <p className="text-light/80 text-sm">
          Forge soporta comentarios inline para excepcionar violaciones línea por línea. Útil cuando una violación es intencional y documentada:
        </p>
        <div className="bg-surface border border-accent/10 rounded-lg p-4 space-y-3">
          <div>
            <code className="block text-sm text-light/70 font-mono leading-relaxed">
              {'// forge-ignore-next-line'}<br />
              {"import { something } from \"../infra/prisma\";  "}<span className="text-accent/50">{'// ← no se reporta'}</span>
            </code>
          </div>
          <div>
            <code className="block text-sm text-light/70 font-mono leading-relaxed">
              {'// forge-ignore: R1'}<br />
              {"import { PrismaClient } from \"../../infra/prisma/client\"; "}<span className="text-accent/50">{'// ← solo R1 ignorada'}</span>
            </code>
          </div>
          <div>
            <code className="block text-sm text-light/70 font-mono leading-relaxed">
              {'// forge-ignore: R1, R8'}<br />
              {"import { crossFeature } from \"../other-feature/domain/Entity\"; "}<span className="text-accent/50">{'// ← R1 y R8 ignoradas'}</span>
            </code>
          </div>
        </div>
        <p className="text-light/60 text-xs">
          Los inline ignores se pueden visualizar con <code className="text-accent">forge quench --show-ignores</code>.
        </p>
      </section>
    </article>
  )
}
