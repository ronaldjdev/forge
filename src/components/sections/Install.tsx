import { motion } from "framer-motion";
import { StarButton } from "../StarButton";
import { SectionHeader } from "../ui/SectionHeader";
import { Button } from "../ui/Button";

export function Install() {
  return (
    <section
      id="instalacion"
      className="py-24 bg-surface"
    >
      <div className="max-w-4xl mx-auto px-6">
        <SectionHeader
          title="Empieza en 30 segundos"
          description="Instala Forge en tu proyecto o de forma global"
        />
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-8 bg-dark border border-accent/20"
          >
            <div className="text-sm font-medium mb-2 text-accent">
              En un proyecto
            </div>
            <h3 className="text-lg font-semibold mb-4 text-ink">
              Instalación local
            </h3>
            <code className="block p-4 text-sm font-mono leading-relaxed bg-surface text-light">
              npx @ronaldjdev/forge install
            </code>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 bg-dark border border-accent/20"
          >
            <div className="text-sm font-medium mb-2 text-accent">
              Global
            </div>
            <h3 className="text-lg font-semibold mb-4 text-ink">
              Disponible en todos tus proyectos
            </h3>
            <code className="block p-4 text-sm font-mono leading-relaxed bg-surface text-light">
              npx @ronaldjdev/forge install --global
            </code>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <p className="text-sm mb-4 text-light/50">
            Requiere Node.js ≥ 18
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="primary" href="https://github.com/ronaldjdev/forge" target="_blank" rel="noopener noreferrer" className="px-8 py-4 text-lg">
              Ver en GitHub
            </Button>
            <StarButton />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
