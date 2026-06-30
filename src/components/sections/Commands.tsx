import { motion } from "framer-motion";
import { useState } from "react";
import { SectionHeader } from "../ui/SectionHeader";

const commands = [
  { name: "forge", desc: "Inicializar proyecto completo", category: "init" },
  {
    name: "cast",
    desc: "Crear feature con estructura hexagonal",
    category: "create",
  },
  {
    name: "inspect",
    desc: "Auditoría arquitectónica 0-100",
    category: "audit",
  },
  { name: "quench", desc: "Validar 9 reglas R1-R9", category: "audit" },
  {
    name: "chain",
    desc: "Análisis de dependencias en grafo",
    category: "audit",
  },
  {
    name: "graph",
    desc: "Grafo arquitectónico y risk score",
    category: "audit",
  },
  {
    name: "assay",
    desc: "Ensayo arquitectónico multi-persona",
    category: "review",
  },
  {
    name: "relocate",
    desc: "Migrar código a capas correctas",
    category: "refactor",
  },
  {
    name: "reforge",
    desc: "Reestructurar features o componentes",
    category: "refactor",
  },
  {
    name: "temper",
    desc: "Aplicar inyección de dependencias",
    category: "refactor",
  },
  { name: "smelt", desc: "Extraer código a shared/", category: "refactor" },
  {
    name: "forge hook",
    desc: "Pre-commit hook arquitectónico",
    category: "ops",
  },
  {
    name: "forge state",
    desc: "Estado persistente post-auditoría",
    category: "audit",
  },
  { name: "inscribe", desc: "Generar ARCHITECTURE.md", category: "docs" },
  {
    name: "nail / unnail",
    desc: "Shortcuts de navegación",
    category: "ops",
  },
  {
    name: "forge api",
    desc: "Validar contratos API",
    category: "audit",
  },
  {
    name: "forge rollback",
    desc: "Restaurar puntos de guardado",
    category: "ops",
  },
  {
    name: "forge update",
    desc: "Verificar actualizaciones",
    category: "ops",
  },
];

const categories = [
  { id: "all", label: "Todos" },
  { id: "init", label: "Inicializar" },
  { id: "create", label: "Crear" },
  { id: "audit", label: "Auditar" },
  { id: "review", label: "Evaluar" },
  { id: "refactor", label: "Refactorizar" },
  { id: "ops", label: "Automatizar" },
  { id: "docs", label: "Documentar" },
];

export function Commands() {
  const [active, setActive] = useState("all");

  const filtered =
    active === "all" ? commands : commands.filter((c) => c.category === active);

  return (
    <section
      id="comandos"
      className="py-24 bg-surface"
    >
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          title="+14 comandos CLI"
          description="Comandos directos que imponen disciplina arquitectónica sin negociar"
        >
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 text-sm font-medium transition-all"
                style={{
                  backgroundColor:
                    active === cat.id ? "#e7ffa5" : "transparent",
                  color: active === cat.id ? "#050505" : "#eeeeee",
                  border:
                    active === cat.id
                      ? "none"
                      : "1px solid rgba(231, 255, 165, 0.3)",
                }}
              >
                {cat.label}
              </motion.button>
            ))}
          </div>
        </SectionHeader>

        <motion.div layout className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {filtered.map((cmd) => (
            <motion.div
              key={cmd.name}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{
                scale: 1.03,
                borderColor: "rgba(231, 255, 165, 0.5)",
              }}
              className="p-5 cursor-pointer transition-all bg-dark border border-accent/20"
            >
              <div className="text-lg font-bold mb-2 text-accent font-display tracking-widest">
                {cmd.name}
              </div>
              <div className="text-xs leading-relaxed text-light/80">
                {cmd.desc}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-accent/5 border border-accent/20"
        >
          <div>
            <h3 className="font-semibold mb-1 text-ink font-display tracking-wider">
              ¿Prefieres no instalar?
            </h3>
            <p className="text-sm text-light/70">
              Usa npx directamente sin instalación global
            </p>
          </div>
          <code className="px-4 py-2 font-display tracking-wider text-sm bg-dark text-accent">
            npx @ronaldjdev/forge &lt;command&gt;
          </code>
        </motion.div>
      </div>
    </section>
  );
}
