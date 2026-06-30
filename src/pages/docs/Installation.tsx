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
        <h2 className="font-display text-2xl text-ink">Wizard interactivo</h2>
        <p className="text-light/80">
          Forge incluye un wizard de instalación interactivo con 7 fases que te guía paso a paso:
        </p>
        <ol className="list-decimal list-inside text-light/80 text-sm space-y-1">
          <li>Bienvenida y descripción de Forge</li>
          <li>Detección automática de agentes compatibles en tu sistema</li>
          <li>Selección de agentes objetivo</li>
          <li>Resumen de instalación</li>
          <li>Instalación con progreso</li>
          <li>Verificación post-instalación</li>
          <li>Finalización</li>
        </ol>
        <div className="bg-surface border border-accent/10 rounded-lg p-4">
          <code className="text-sm text-accent">npx @ronaldjdev/forge install</code>
        </div>
        <p className="text-light/80">Ejecuta el wizard que detecta automáticamente qué agentes tienes instalados y te permite seleccionar.</p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Instalación multi-agente</h2>
        <p className="text-light/80">
          Forge se despliega como skill en múltiples agentes de IA simultáneamente. Usa flags para elegir el destino:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-accent/10">
                <th className="text-left py-2 px-3 text-accent font-display">Flag</th>
                <th className="text-left py-2 px-3 text-accent font-display">Agente</th>
                <th className="text-left py-2 px-3 text-accent font-display">Hook activo</th>
              </tr>
            </thead>
            <tbody className="text-light/80">
              {[
                ['--opencode', 'OpenCode', 'forgeSentinel (vía SKILL.md)'],
                ['--cursor', 'Cursor', 'forgeSmith (preToolUse)'],
                ['--claude', 'Claude Code', 'forgeSentinel (PostToolUse)'],
                ['--codex', 'Codex CLI', 'forgeSentinel (PostToolUse)'],
                ['--gemini', 'Gemini Code Assist', '—'],
                ['--all', 'Todos los anteriores', '—'],
                ['--global', '~/.config/opencode/', 'forgeSentinel'],
              ].map(([flag, agent, hook]) => (
                <tr key={flag} className="border-b border-white/5">
                  <td className="py-2 px-3 font-mono text-accent">{flag}</td>
                  <td className="py-2 px-3">{agent}</td>
                  <td className="py-2 px-3 text-light/60 text-xs">{hook}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
