const profiles = [
  {
    name: 'Express + MongoDB + Mongoose',
    key: 'express-mongodb',
    framework: 'Express',
    runtime: 'Node 20+',
    database: 'MongoDB',
    orm: 'Mongoose',
    di: 'tsyringe',
    structure: [
      'features/<domain>/domain/', 'features/<domain>/application/', 'features/<domain>/adapters/',
      'shared/errors/', 'shared/port/', 'shared/utils/',
      'infrastructure/db.ts', 'adapters/out/email/', 'adapters/out/scheduler/',
      'setting/', 'app.ts', 'server.ts',
    ],
    diDetail: 'Usa tsyringe con @injectable() y @inject() con tokens de clase. container.resolve() solo en bootstrap.',
    features: ['Routes: Express Router con container.resolve()', 'Controller: arrow-methods, @injectable()', 'Persistence: Mongoose schemas + repository pattern', 'Transactions: mongoose.ClientSession', 'Testing: container.registerInstance() para mocks'],
  },
  {
    name: 'Express + PostgreSQL (raw)',
    key: 'express-postgres',
    framework: 'Express',
    runtime: 'Node 20+',
    database: 'PostgreSQL',
    orm: 'node-postgres (pg)',
    di: 'Manual',
    structure: [
      'features/<domain>/domain/', 'features/<domain>/application/', 'features/<domain>/adapters/',
      'shared/', 'infrastructure/pool.ts', 'server.ts',
    ],
    diDetail: 'DI manual sin contenedor externo. Las dependencias se inyectan por constructor y se instancian en bootstrap.',
    features: ['Routes: Express Router con factory function', 'Controller: constructor injection manual', 'Persistence: pg Pool singleton + repository pattern', 'Transactions: client.query("BEGIN/COMMIT/ROLLBACK")', 'Testing: mocks manuales con jest.fn()'],
  },
  {
    name: 'Express + Prisma',
    key: 'express-prisma',
    framework: 'Express',
    runtime: 'Node 20+',
    database: 'Cualquier RDBMS',
    orm: 'Prisma',
    di: 'tsyringe',
    structure: [
      'prisma/schema.prisma',
      'features/<domain>/domain/', 'features/<domain>/application/', 'features/<domain>/adapters/',
      'shared/', 'infrastructure/prisma.ts', 'server.ts',
    ],
    diDetail: 'Misma estrategia que express-mongodb (tsyringe). PrismaClient singleton en infra/prisma.ts.',
    features: ['DI: tsyringe (@injectable, @inject)', 'Persistence: PrismaClient + repository pattern', 'Transactions: prisma.$transaction()', 'Testing: container.registerInstance() con mocks'],
  },
  {
    name: 'Fastify + PostgreSQL + Prisma',
    key: 'fastify-postgres',
    framework: 'Fastify',
    runtime: 'Node 20+',
    database: 'PostgreSQL',
    orm: 'Prisma',
    di: 'Manual',
    structure: [
      'prisma/schema.prisma',
      'features/<domain>/domain/', 'features/<domain>/application/', 'features/<domain>/adapters/',
      'shared/', 'infrastructure/prisma.ts', 'app.ts', 'server.ts',
    ],
    diDetail: 'DI manual. Dependencias inyectadas por constructor y registradas en bootstrap. Sin contenedor externo.',
    features: ['Routes: Fastify plugin pattern', 'Controller: constructor injection con FastifyRequest/FastifyReply', 'Persistence: Prisma + repository pattern', 'Transactions: prisma.$transaction()', 'Testing: app.inject() de Fastify'],
  },
  {
    name: 'NestJS + Prisma',
    key: 'nestjs-prisma',
    framework: 'NestJS',
    runtime: 'Node 20+',
    database: 'Cualquier RDBMS',
    orm: 'Prisma',
    di: 'NestJS DI',
    structure: [
      'prisma/schema.prisma',
      'features/<domain>/domain/', 'features/<domain>/application/', 'features/<domain>/adapters/',
      'features/<domain>/adapters/in/http/<domain>.module.ts',
      'app.module.ts',
    ],
    diDetail: 'Usa el sistema de DI nativo de NestJS con @Injectable(), módulos y providers.',
    features: ['DI: @Injectable() de NestJS + módulos con providers/exports', 'Controller: @Controller() con decoradores NestJS', 'Persistence: PrismaService que extiende PrismaClient', 'Cross-feature: modules exportan providers', 'Testing: Test.createTestingModule()'],
  },
  {
    name: 'Express + Drizzle ORM',
    key: 'express-drizzle',
    framework: 'Express',
    runtime: 'Node 20+',
    database: 'PostgreSQL / MySQL / SQLite',
    orm: 'Drizzle',
    di: 'tsyringe',
    structure: [
      'db/schema.ts',
      'features/<domain>/domain/', 'features/<domain>/application/', 'features/<domain>/adapters/',
      'shared/', 'app.ts', 'server.ts',
    ],
    diDetail: 'Usa tsyringe con @injectable() y @inject() con tokens de clase. Container wiring en app.ts.',
    features: ['DI: tsyringe con @injectable() y @inject()', 'Persistence: Drizzle ORM con esquemas type-safe', 'Migrations: npx drizzle-kit generate / migrate', 'Testing: mocks de DrizzleClient'],
  },
  {
    name: 'Fastify + MongoDB + Mongoose',
    key: 'fastify-mongodb',
    framework: 'Fastify',
    runtime: 'Node 20+',
    database: 'MongoDB',
    orm: 'Mongoose',
    di: 'Manual',
    structure: [
      'features/<domain>/domain/', 'features/<domain>/application/', 'features/<domain>/adapters/',
      'shared/', 'infrastructure/mongoose.ts', 'infrastructure/models/', 'app.ts', 'server.ts',
    ],
    diDetail: 'DI manual sin contenedor. Cableado en app.ts con Fastify plugin pattern.',
    features: ['Routes: Fastify plugin pattern', 'Controller: constructor injection con FastifyRequest/FastifyReply', 'Persistence: Mongoose schemas + repository pattern', 'Testing: MongoMemoryServer para tests de integración'],
  },
  {
    name: 'Fastify + Prisma',
    key: 'fastify-prisma',
    framework: 'Fastify',
    runtime: 'Node 20+',
    database: 'Cualquier RDBMS',
    orm: 'Prisma',
    di: 'Manual',
    structure: [
      'prisma/schema.prisma',
      'features/<domain>/domain/', 'features/<domain>/application/', 'features/<domain>/adapters/',
      'shared/', 'infrastructure/prisma.ts', 'app.ts', 'server.ts',
    ],
    diDetail: 'DI manual. Dependencias inyectadas por constructor y cableadas en app.ts. PrismaClient singleton en infra/prisma.ts.',
    features: ['Routes: Fastify plugin pattern con factory function', 'Controller: constructor injection', 'Persistence: PrismaClient + repository pattern', 'Transactions: prisma.$transaction()', 'Testing: app.inject() de Fastify con mocks'],
  },
  {
    name: 'NestJS + MongoDB + Mongoose',
    key: 'nestjs-mongodb',
    framework: 'NestJS',
    runtime: 'Node 20+',
    database: 'MongoDB',
    orm: 'Mongoose',
    di: 'NestJS DI',
    structure: [
      'features/<domain>/domain/', 'features/<domain>/application/', 'features/<domain>/adapters/',
      'features/<domain>/adapters/in/http/<domain>.module.ts',
      'features/<domain>/adapters/out/persistence/<domain>.schema.ts',
      'shared/', 'app.module.ts', 'main.ts',
    ],
    diDetail: 'NestJS DI nativo con @Injectable() y módulos. Conexión Mongoose via MongooseModule.forRoot().',
    features: ['DI: @Injectable() de NestJS + MongooseModule', 'Persistence: @nestjs/mongoose con @Schema() decorators', 'Cross-feature: módulos exportan providers', 'Testing: MongoMemoryServer + Test.createTestingModule()'],
  },
  {
    name: 'NestJS + PostgreSQL + Prisma',
    key: 'nestjs-postgres',
    framework: 'NestJS',
    runtime: 'Node 20+',
    database: 'PostgreSQL',
    orm: 'Prisma',
    di: 'NestJS DI',
    structure: [
      'prisma/schema.prisma',
      'features/<domain>/domain/', 'features/<domain>/application/', 'features/<domain>/adapters/',
      'features/<domain>/adapters/in/http/<domain>.module.ts',
      'shared/', 'app.module.ts', 'main.ts',
    ],
    diDetail: 'NestJS DI nativo con @Injectable() y módulos. PrismaService que extiende PrismaClient como provider global.',
    features: ['DI: @Injectable() de NestJS + módulos con providers/exports', 'Persistence: PrismaService + repository pattern', 'Transactions: prisma.$transaction()', 'Cross-feature: módulos exportan providers', 'Testing: Test.createTestingModule() con mocks'],
  },
]

export function Profiles() {
  return (
    <article className="space-y-8">
      <h1 className="font-display text-4xl text-ink">Perfiles Tecnológicos</h1>
      <p className="text-light/80 leading-relaxed">
        Forge incluye 10 perfiles predefinidos que capturan las convenciones específicas de cada stack tecnológico:
        estructura de directorios, estrategia de DI, routing, persistencia y testing.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-accent/10">
              <th className="text-left py-2 px-3 text-accent font-display">Perfil</th>
              <th className="text-left py-2 px-3 text-accent font-display">Framework</th>
              <th className="text-left py-2 px-3 text-accent font-display">BD</th>
              <th className="text-left py-2 px-3 text-accent font-display">ORM</th>
              <th className="text-left py-2 px-3 text-accent font-display">DI</th>
            </tr>
          </thead>
          <tbody className="text-light/80">
            {profiles.map((p) => (
              <tr key={p.key} className="border-b border-white/5">
                <td className="py-2 px-3 font-mono text-accent">{p.key}</td>
                <td className="py-2 px-3">{p.framework}</td>
                <td className="py-2 px-3">{p.database}</td>
                <td className="py-2 px-3">{p.orm}</td>
                <td className="py-2 px-3">{p.di}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {profiles.map((p) => (
        <section key={p.key} className="space-y-4 scroll-mt-24">
          <h2 className="font-display text-2xl text-accent">{p.name}</h2>

          <div className="bg-surface border border-accent/10 rounded-lg p-4 space-y-2">
            <p className="text-light/70 text-sm">{p.diDetail}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-sm text-ink uppercase tracking-wider">Estructura</h3>
            <div className="flex flex-wrap gap-2">
              {p.structure.map((d) => (
                <span key={d} className="text-xs px-2 py-1 bg-white/5 text-light/50 font-mono rounded">{d}</span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-sm text-ink uppercase tracking-wider">Características</h3>
            <ul className="list-disc list-inside text-light/80 text-sm space-y-1">
              {p.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
        </section>
      ))}
    </article>
  )
}
