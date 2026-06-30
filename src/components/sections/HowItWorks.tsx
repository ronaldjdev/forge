import { motion } from "framer-motion";
import { SectionHeader } from "../ui/SectionHeader";

const steps = [
  {
    num: "01",
    title: "Instala",
    desc: "Instala Forge con el wizard interactivo o directamente — soporta OpenCode, Cursor, Claude Code, Codex CLI y Gemini",
    code: "npx @ronaldjdev/forge install",
  },
  {
    num: "02",
    title: "Inicializa",
    desc: "Ejecuta `forge` para detectar stack, determinar perfil, analizar ownership y generar ARCHITECTURE.md",
    code: "forge",
  },
  {
    num: "03",
    title: "Crea features",
    desc: "Usa `cast` para generar features completos con estructura hexagonal y todas sus capas",
    code: "forge cast users",
  },
  {
    num: "04",
    title: "Audita y refina",
    desc: "Evalúa con `inspect`, valida reglas R1-R9 con `quench` y auto-corrige violaciones con `--fix`",
    code: "forge inspect && forge quench --fix",
  },
  {
    num: "05",
    title: "Evalúa con Assay",
    desc: "Genera un ensayo multi-persona (Bezos, Fowler, Hacker, PM, Senior) para interpretar los resultados",
    code: "forge assay",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-surface">
      <div className="max-w-5xl mx-auto px-6">
        <SectionHeader
          title="Cómo funciona"
          description="5 pasos para auditar, construir y evolucionar tu arquitectura backend"
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
                  <h3 className="text-2xl font-bold mb-3 text-ink font-display">
                    {step.title}
                  </h3>
                  <p className="mb-5 max-w-xl text-light/70">
                    {step.desc}
                  </p>
                  <code className="inline-block px-5 py-3 text-sm tracking-wider bg-dark text-accent font-display">
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
