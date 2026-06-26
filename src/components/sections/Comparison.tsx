import { motion } from "framer-motion";
import { SectionHeader } from "../ui/SectionHeader";

const comparisons = [
  {
    before: "Código acoplado",
    after: "Arquitectura clara",
  },
  {
    before: "Dependencias aleatorias",
    after: "Reglas R1-R9 aplicadas",
  },
  {
    before: "¿Quién posee este código?",
    after: "Ownership automático",
  },
  {
    before: "Documentación obsoleta",
    after: "ARCHITECTURE.md vivo",
  },
  {
    before: "Auditoría manual",
    after: "Score 0-110 en segundos",
  },
];

export function Comparison() {
  return (
    <section id="comparacion" className="py-24 bg-dark">
      <div className="max-w-4xl mx-auto px-6">
        <SectionHeader
          title="Sin Forge vs Con Forge"
          description="La diferencia entre código que degenera y código que evoluciona"
        />
        <div className="space-y-6">
          {comparisons.map((item, i) => (
            <motion.div
              key={item.before}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col md:grid md:grid-cols-3 gap-4 items-center p-6 bg-surface border border-accent/15"
            >
              <div className="w-full md:col-span-1 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-0">
                <div className="flex-1  md:flex-none">
                  <div className="text-xs md:text-sm mb-0 md:mb-1 text-light/50">
                    Sin Forge
                  </div>
                  <div className="text-sm md:text-base font-medium line-through text-[rgba(229,229,229,0.45)]">
                    {item.before}
                  </div>
                </div>
              </div>
              <div className="flex justify-center items-center">
                <div className="rotate-90 md:rotate-0 shrink-0 px-3 py-1 md:px-4 md:py-2 text-sm font-medium bg-accent/10 text-accent">
                  →
                </div>
              </div>
              <div className="w-full md:col-span-1">
                <div className="text-xs md:text-sm mb-1 text-accent">
                  Con Forge
                </div>
                <div className="text-sm md:text-base font-semibold text-ink font-display tracking-wider">
                  {item.after}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
