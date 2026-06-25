export function Patterns() {
  return (
    <article className="space-y-8">
      <h1 className="font-display text-4xl text-ink">Convenciones</h1>
      <p className="text-light/80 leading-relaxed">
        Forge sigue convenciones de nomenclatura estrictas que garantizan consistencia en todo el proyecto.
      </p>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Globales</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-accent/10">
                <th className="text-left py-2 px-3 text-accent font-display">Elemento</th>
                <th className="text-left py-2 px-3 text-accent font-display">Formato</th>
                <th className="text-left py-2 px-3 text-accent font-display">Ejemplo</th>
              </tr>
            </thead>
            <tbody className="text-light/80">
              {[
                ['Directorios', 'kebab-case/', 'credit-card/, event-bus/'],
                ['Archivos', '<PascalCase>.<artefacto>.ts', 'User.entity.ts'],
                ['Interfaces', 'I<PascalCase>.<artefacto>.ts', 'IUser.repository.ts'],
                ['Use cases', '<Action>.uc.ts', 'CreateUser.uc.ts'],
                ['Clases', 'PascalCase', 'UserController, DatabaseConfig'],
                ['Funciones', 'camelCase', 'formatDate, userService'],
                ['Constantes', 'UPPER_SNAKE_CASE', 'MAX_RETRY_COUNT'],
                ['Tipos', 'PascalCase', 'UserPayload, PaginatedResult'],
                ['Enums', 'PascalCase', 'UserRole, OrderStatus'],
                ['Barrel files', 'index.ts', 'named exports, sin export default'],
              ].map(([element, format, example]) => (
                <tr key={element} className="border-b border-white/5">
                  <td className="py-2 px-3">{element}</td>
                  <td className="py-2 px-3 font-mono text-xs">{format}</td>
                  <td className="py-2 px-3 font-mono text-xs text-accent">{example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Feature Layer</h2>
        <div className="bg-surface border border-accent/10 rounded-lg p-4">
          <pre className="text-sm text-light/60 font-mono leading-relaxed">{`src/features/<feature-name>/
├── domain/
│   ├── <Domain>.entity.ts
│   └── I<Domain>.repository.ts
├── application/
│   ├── use-cases/
│   │   ├── Create<Domain>.uc.ts
│   │   ├── Get<Domain>.uc.ts
│   │   ├── List<Domain>.uc.ts
│   │   ├── Update<Domain>.uc.ts
│   │   └── Delete<Domain>.uc.ts
│   └── mappers/
│       └── <Domain>.mapper.ts
└── adapters/
    ├── in/http/
    │   ├── <Domain>.controller.ts
    │   └── <Domain>.routes.ts
    └── out/persistence/
        ├── <Domain>.repository.ts
        └── <Domain>.schema.ts`}</pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Platform Layer</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-accent/10">
                <th className="text-left py-2 px-3 text-accent font-display">Directorio</th>
                <th className="text-left py-2 px-3 text-accent font-display">Archivos</th>
              </tr>
            </thead>
            <tbody className="text-light/80">
              {[
                ['config/', 'App.config.ts, Env.config.ts, Database.config.ts'],
                ['server/', 'Server.ts, App.ts'],
                ['database/', 'Database.config.ts, Connection.ts'],
                ['http/', 'Router.ts, Auth.middleware.ts, Error.middleware.ts'],
                ['logger/', 'Logger.config.ts, Logger.service.ts'],
                ['cache/', 'Cache.config.ts, Cache.service.ts'],
                ['security/', 'Auth.middleware.ts, Encryption.service.ts'],
                ['events/', 'EventBus.ts, EventHandler.ts'],
                ['scheduler/', 'Scheduler.config.ts, Scheduler.service.ts'],
                ['observability/', 'Metrics.ts, Tracing.ts, Health.ts'],
                ['di/', 'Container.ts, Tokens.ts, Module.ts'],
              ].map(([dir, files]) => (
                <tr key={dir} className="border-b border-white/5">
                  <td className="py-2 px-3 font-mono text-accent text-xs">{dir}</td>
                  <td className="py-2 px-3 font-mono text-xs text-light/70">{files}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Shared Layer</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-accent/10">
                <th className="text-left py-2 px-3 text-accent font-display">Directorio</th>
                <th className="text-left py-2 px-3 text-accent font-display">Archivos</th>
              </tr>
            </thead>
            <tbody className="text-light/80">
              {[
                ['errors/', '<Name>Error.ts (NotFoundError, ValidationError)'],
                ['contracts/', 'I<Name>.ts (IPaginatedResponse)'],
                ['types/', '<dominio>.types.ts (api.types, user.types)'],
                ['utils/', '<util>.ts (formatDate, pagination)'],
              ].map(([dir, files]) => (
                <tr key={dir} className="border-b border-white/5">
                  <td className="py-2 px-3 font-mono text-accent text-xs">{dir}</td>
                  <td className="py-2 px-3 font-mono text-xs text-light/70">{files}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Infra Layer</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-accent/10">
                <th className="text-left py-2 px-3 text-accent font-display">Directorio</th>
                <th className="text-left py-2 px-3 text-accent font-display">Archivos</th>
              </tr>
            </thead>
            <tbody className="text-light/80">
              {[
                ['prisma/', 'Prisma.client.ts, Prisma.service.ts'],
                ['mongodb/', 'Mongo.config.ts, <Name>.model.ts'],
                ['redis/', 'Redis.config.ts, Redis.service.ts'],
                ['mail/', 'Mail.config.ts, Mail.service.ts'],
                ['s3/', 'S3.config.ts, S3.service.ts'],
              ].map(([dir, files]) => (
                <tr key={dir} className="border-b border-white/5">
                  <td className="py-2 px-3 font-mono text-accent text-xs">{dir}</td>
                  <td className="py-2 px-3 font-mono text-xs text-light/70">{files}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Export Conventions</h2>
        <ul className="list-disc list-inside text-light/80 text-sm space-y-1">
          <li>Cada directorio expone un index.ts barrel con named exports</li>
          <li>Usar <code className="text-accent text-xs">{'export * from "./<Name>.<artifact>.js"'}</code> en barrels</li>
          <li>Preferir <code className="text-accent text-xs">export function</code> / <code className="text-accent text-xs">export class</code> sobre <code className="text-accent text-xs">export default</code></li>
          <li>Imports relativos dentro del mismo feature: <code className="text-accent text-xs">../../domain/</code></li>
          <li>Path alias para cross-layer: <code className="text-accent text-xs">@/platform/</code>, <code className="text-accent text-xs">@/shared/</code>, <code className="text-accent text-xs">@/infra/</code></li>
          <li>Extensión <code className="text-accent text-xs">.js</code> en imports (ESM compat): <code className="text-accent text-xs">{'import { X } from "./foo.js"'}</code></li>
        </ul>
      </section>
    </article>
  )
}
