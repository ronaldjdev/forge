import { motion } from "framer-motion";
import { SectionHeader } from "../ui/SectionHeader";

const steps = [
  {
    num: "01",
    title: "Inicializa",
    desc: "Ejecuta `forge` para detectar stack, crear estructura base y generar ARCHITECTURE.md",
    code: "npx @ronaldjdev/forge install",
  },
  {
    num: "02",
    title: "Crea features",
    desc: "Usa `cast` para generar features completos con arquitectura hexagonal",
    code: "forge cast users",
  },
  {
    num: "03",
    title: "Audita",
    desc: "Ejecuta `inspect` para evaluar tu arquitectura con score de 0-100",
    code: "forge inspect",
  },
  {
    num: "04",
    title: "Refina",
    desc: "Aplica reglas R1-R9 con `quench` y refactoriza con `reforge`",
    code: "forge quench",
  },
    {
    num: "05",
    title: "Itera",
    desc: "Repite el proceso hasta alcanzar tu arquitectura ideal",
    code: "forge temper",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-surface">
      <div className="max-w-5xl mx-auto px-6">
        <SectionHeader
          title="Cómo funciona"
          description="5 pasos para imponer disciplina arquitectónica en tu proyecto"
        />
        <div className="relative">
          <div className="absolute left-9 top-0 bottom-0 w-px hidden md:block bg-accent/20" />
          <div className="space-y-10 md:space-y-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative flex gap-4 md:gap-8"
              >
                <div className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center shrink-0 z-10 bg-accent/10 border border-accent/30">
                  <span className="text-lg font-mono font-bold text-accent">
                    {step.num}
                  </span>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-2xl font-bold mb-3 text-ink">
                    {step.title}
                  </h3>
                  <p className="mb-5 max-w-xl text-light/70">
                    {step.desc}
                  </p>
                  <code className="inline-block px-5 py-3 text-sm font-mono bg-dark text-accent">
                    {step.code}
                  </code>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
