import { motion } from 'framer-motion'
import { SectionHeader } from "../ui/SectionHeader"

const layers = [
  {
    name: 'Platform',
    desc: 'Backbone técnico global. Configuración, servidor, logging, DI, seguridad, cache, eventos.',
    color: '#e7ffa5',
    components: ['config/', 'database/', 'http/', 'server/', 'logger/', 'di/', 'security/', 'events/', 'cache/', 'observability/'],
  },
  {
    name: 'Features',
    desc: 'Capacidades de negocio. Cada feature es un vertical slice con su propia lógica.',
    color: '#eeeeee',
    components: ['domain/', 'application/', 'adapters/'],
  },
  {
    name: 'Shared',
    desc: 'Componentes reutilizables puros. Sin dependencias de negocio ni infraestructura.',
    color: '#e7ffa5',
    components: ['errors/', 'contracts/', 'types/', 'utils/'],
  },
  {
    name: 'Infra',
    desc: 'Implementaciones concretas. ORMs, clientes de BD, servicios externos.',
    color: '#eeeeee',
    components: ['prisma/', 'mongodb/', 'redis/', 'mail/', 'storage/'],
  },
]

export function Architecture() {
  return (
    <section id="arquitectura" className="py-24 bg-dark">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          title="Arquitectura de 4 capas"
          description="Cada capa tiene responsabilidad clara y dependencias estrictamente controladas"
        />
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 bg-surface border border-accent/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 shrink-0" style={{ backgroundColor: layer.color }}></div>
                <h3 className="text-xl font-bold" style={{ color: layer.color }}>{layer.name}</h3>
              </div>
              <p className="mb-6 text-sm text-light/70">{layer.desc}</p>
              <div className="flex flex-wrap gap-2">
                {layer.components.map((comp) => (
                  <span
                    key={comp}
                    className="px-3 py-1 text-xs font-mono bg-dark/50 text-light/80"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="p-8 bg-surface border border-accent/20"
        >
          <h3 className="text-xl font-bold mb-6 text-center text-ink">
            Reglas de dependencia R1-R9
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { rule: 'R1', from: 'feature → infra', severity: 'CRITICAL', color: '#e7ffa5' },
              { rule: 'R2', from: 'platform → feature', severity: 'CRITICAL', color: '#e7ffa5' },
              { rule: 'R3', from: 'shared → feature', severity: 'ERROR', color: '#e7ffa5' },
              { rule: 'R4', from: 'shared → infra', severity: 'ERROR', color: '#e7ffa5' },
              { rule: 'R5', from: 'domain → infra', severity: 'CRITICAL', color: '#e7ffa5' },
              { rule: 'R6', from: 'domain → platform', severity: 'CRITICAL', color: '#e7ffa5' },
              { rule: 'R7', from: 'infra → feature', severity: 'WARNING', color: '#eeeeee' },
              { rule: 'R8', from: 'cross-feature', severity: 'ERROR', color: '#e7ffa5' },
              { rule: 'R9', from: 'ciclos', severity: 'ERROR', color: '#e7ffa5' },
            ].map((r) => (
              <div
                key={r.rule}
                className="flex items-center gap-3 p-3 bg-dark/50 border border-accent/15"
              >
                <span className="font-mono font-bold text-accent">{r.rule}</span>
                <span className="text-sm flex-1 text-light">{r.from}</span>
                <span
                  className={`text-xs px-2 py-1 font-medium ${r.severity === 'CRITICAL' ? 'bg-red-900/20' : 'bg-accent/20'}`}
                  style={{ color: r.color }}
                >
                  {r.severity}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
