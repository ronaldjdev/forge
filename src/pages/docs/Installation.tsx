export function Installation() {
  return (
    <article className="space-y-8">
      <h1 className="font-display text-4xl text-ink">Instalación</h1>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Requisitos</h2>
        <ul className="list-disc list-inside text-light/80 space-y-1">
          <li>Node.js ≥ 18</li>
          <li>npm o pnpm</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">En un proyecto</h2>
        <p className="text-light/80">Instala Forge en el proyecto actual usando npx:</p>
        <div className="bg-surface border border-accent/10 rounded-lg p-4">
          <code className="text-sm text-accent">npx @ronaldjdev/forge install</code>
        </div>
        <p className="text-light/80">Esto copia la skill en <code className="text-accent text-sm">.opencode/skills/forge/</code> del proyecto actual.</p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Global (todos los proyectos)</h2>
        <div className="bg-surface border border-accent/10 rounded-lg p-4">
          <code className="text-sm text-accent">npx @ronaldjdev/forge install --global</code>
        </div>
        <p className="text-light/80">Esto copia la skill en <code className="text-accent text-sm">~/.config/opencode/skills/forge/</code> para que esté disponible en todos los proyectos.</p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">CLI Global</h2>
        <div className="bg-surface border border-accent/10 rounded-lg p-4 space-y-2">
          <code className="block text-sm text-accent">npm install -g @ronaldjdev/forge</code>
          <code className="block text-sm text-accent">forge install</code>
          <code className="block text-sm text-accent">forge install -g</code>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Desarrollo</h2>
        <div className="bg-surface border border-accent/10 rounded-lg p-4">
          <code className="text-sm text-accent">git clone https://github.com/ronaldjdev/forge.git</code>
        </div>
        <p className="text-light/80">
          La skill se referencia desde <code className="text-accent text-sm">.opencode/skills/forge/</code> como symlink a <code className="text-accent text-sm">skills/forge/</code>, por lo que cualquier cambio se refleja inmediatamente.
        </p>
      </section>
    </article>
  )
}
