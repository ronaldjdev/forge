import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionHeader } from "../ui/SectionHeader";

const stats = [
  { value: "110", label: "Puntos de auditoría", desc: "En 6 categorías" },
  {
    value: "4",
    label: "Capas arquitectónicas",
    desc: "Platform, Features, Shared, Infra",
  },
  {
    value: "+10",
    label: "Comandos CLI",
    desc: "Forge, cast, inspect, quench...",
  },
  { value: "9", label: "Reglas R1-R9", desc: "Aplicación de dependencias" },
];

function StatCard({ stat, index }: { stat: (typeof stats)[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="p-8 text-center bg-surface border border-accent/20"
    >
      <motion.div
        initial={{ scale: 0.5 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
        className="text-4xl lg:text-5xl font-bold mb-2 font-display text-accent"
      >
        {stat.value}
      </motion.div>
      <div className="text-lg font-semibold mb-1 text-ink">
        {stat.label}
      </div>
      <div className="text-sm text-light/80">
        {stat.desc}
      </div>
    </motion.div>
  );
}

export function Stats() {
  return (
    <section className="py-24 bg-surface">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          title="Métricas que importan"
          description="Forge cuantifica tu arquitectura para que puedas mejorarla sistemáticamente"
        />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
