import { motion } from "framer-motion";
import { StarButton } from "../StarButton";
import { Flash } from "../icons";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

const layers = [
  { name: "Platform", color: "#e7ffa5", desc: "Backbone técnico" },
  { name: "Features", color: "#eeeeee", desc: "Negocio" },
  { name: "Shared", color: "#e7ffa5", desc: "Código puro" },
  { name: "Infra", color: "#eeeeee", desc: "Implementaciones" },
];

const frameworks = [
  { letter: "E", label: "Express" },
  { letter: "F", label: "Fastify" },
  { letter: "N", label: "NestJS" },
  { letter: "P", label: "Prisma" },
  { letter: "P", label: "PostgreSQL" },
  { letter: "M", label: "MongoDB" },
];

export function Hero() {
  return (
    <section
      className="min-h-screen flex items-center pt-20 bg-dark"
    >
      <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30"
          >
            <span className="w-2 h-2 animate-pulse bg-accent"></span>
            <span className="text-sm font-medium text-accent">
              Backend Architecture OS
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[clamp(1.75rem,7vw,4.5rem)] lg:text-7xl font-bold leading-tight font-display tracking-tight wrap-break-words text-ink"
          >
            Arquitectura que
            <br />
            <span className="text-accent">evoluciona</span> contigo
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg leading-relaxed max-w-xl text-light/80"
          >
            Modela, construye, audita y evoluciona sistemas backend con reglas
            de arquitectura automatizadas. Cuatro capas, diez comandos, nueve
            reglas. Sin configuración, sin fricción.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Button variant="primary" href="https://github.com/ronaldjdev/forge" target="_blank" rel="noopener noreferrer" className="px-8 py-4 text-lg">
              Empezar
            </Button>
            <StarButton />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-4 flex max-w-[320px] md:max-w-[420px] lg:max-w-[520px] "
          >
            <div className="marquee-track w-screen">
              <div className="marquee-scroll">
                {frameworks.concat(frameworks).map((fw, i) => (
                  <div key={i} className="marquee-item">
                    <div className="marquee-badge font-display">
                      {fw.letter}
                    </div>
                    <span className="marquee-label">{fw.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative w-full"
        >
          <div className="relative p-8 bg-surface border border-accent/20">
            <div className="absolute -top-4 -right-4 px-3 py-1 text-xs font-mono bg-accent text-dark">
              ~4 capas
            </div>

            <div className="space-y-4">
              {layers.map((layer, i) => (
                <motion.div
                  key={layer.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-dark/50 border border-accent/15"
                >
                  <div
                    className="w-3 h-3 shrink-0"
                    style={{ backgroundColor: layer.color }}
                  ></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-ink">
                      {layer.name}
                    </p>
                    <p className="text-xs text-light/60">
                      {layer.desc}
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 opacity-30 text-accent shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-accent/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-accent">
                  Reglas activas
                </span>
                <Badge variant="error">
                  R1-R9
                </Badge>
              </div>
              <div className="flex gap-2">
                {["CRITICAL", "ERROR", "WARNING"].map((sev) => (
                  <Badge key={sev} variant="accent">
                    {sev}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden md:flex absolute -bottom-6 -left-6 w-24 h-24 items-center justify-center bg-accent/10 border border-accent/30">
            <Flash className="w-[50px] h-[50px] text-accent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
