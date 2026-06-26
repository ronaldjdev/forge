import { motion } from "framer-motion";
import { Bullseye, Search, Paper, Flash, CutPaper, Anvil } from "../icons";
import { SectionHeader } from "../ui/SectionHeader";

const iconComponents = [
  Bullseye,
  Search,
  Paper,
  Flash,
  CutPaper,
  Anvil,
] as const;

const features = [
  {
    title: "Arquitectura auditable",
    desc: "Score 0-110 con grado A-F en 6 categorías: Structure, Layers, Ownership, Platform, Dependencies y Graph.",
  },
  {
    title: "Ownership automático",
    desc: "Detecta huérfanos, duplicados y componentes mal ubicados con sugerencias de reubicación precisas.",
  },
  {
    title: "10 perfiles predefinidos",
    desc: "Express + MongoDB, PostgreSQL, Prisma, Drizzle, Fastify, NestJS.",
  },
  {
    title: "Sin dependencias runtime",
    desc: "Solo Node ≥ 18. Todo corre con scripts ESM propios, sin dependencias mágicas de npm.",
  },
  {
    title: "Documentación viva",
    desc: "ARCHITECTURE.md se genera y actualiza automáticamente tras cada operación.",
  },
  {
    title: "9 reglas estrictas",
    desc: "R1-R9 con severidades CRITICAL/ERROR/WARNING para prevenir acoplamiento.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="py-24 bg-dark"
    >
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          title="Características clave"
          description="Forge impone disciplina arquitectónica automatizada y evolutiva"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => {
            const Icon = iconComponents[i];
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, borderColor: "rgba(231, 255, 165, 0.5)" }}
                className="p-8 transition-all duration-300 bg-surface border border-accent/15"
              >
                <Icon className="mb-4 w-[50px] h-[50px] text-accent" />
                <h3 className="text-xl font-semibold mb-3 text-ink font-display">
                  {feat.title}
                </h3>
                <p className="leading-relaxed text-light/80">
                  {feat.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
