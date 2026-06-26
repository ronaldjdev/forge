#!/usr/bin/env node

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { buildContext } from "./context.mjs";

const ROOT = process.cwd();

const PROFILES = [
  {
    name: "express-mongodb",
    match: (ctx) => ctx.framework === "Express" && ctx.database === "MongoDB" && ctx.orm === "Mongoose",
    deps: ["express", "mongoose"],
    opts: { di: "tsyringe|awilix", test: "vitest|jest", validation: "zod|joi", logger: "pino|winston" },
  },
  {
    name: "express-prisma",
    match: (ctx) => ctx.framework === "Express" && ctx.orm === "Prisma",
    deps: ["express", "@prisma/client"],
    opts: { di: "tsyringe|awilix", test: "vitest|jest", validation: "zod|joi", logger: "pino|winston" },
  },
  {
    name: "express-postgres",
    match: (ctx) => ctx.framework === "Express" && ctx.database === "PostgreSQL" && ctx.orm === "native",
    deps: ["express", "pg"],
    opts: { di: "tsyringe|awilix", test: "vitest|jest", validation: "zod|joi", logger: "pino|winston" },
  },
  {
    name: "express-drizzle",
    match: (ctx) => ctx.framework === "Express" && ctx.orm === "Drizzle",
    deps: ["express", "drizzle-orm"],
    opts: { di: "tsyringe|awilix", test: "vitest|jest", validation: "zod|joi", logger: "pino|winston" },
  },
  {
    name: "fastify-postgres",
    match: (ctx) => ctx.framework === "Fastify" && ctx.database === "PostgreSQL" && ctx.orm === "Prisma",
    deps: ["fastify", "@prisma/client"],
    opts: { test: "vitest|jest", validation: "zod|typebox", logger: "pino" },
  },
  {
    name: "fastify-prisma",
    match: (ctx) => ctx.framework === "Fastify" && ctx.orm === "Prisma",
    deps: ["fastify", "@prisma/client"],
    opts: { test: "vitest|jest", validation: "zod|typebox", logger: "pino" },
  },
  {
    name: "fastify-mongodb",
    match: (ctx) => ctx.framework === "Fastify" && ctx.database === "MongoDB" && ctx.orm === "Mongoose",
    deps: ["fastify", "mongoose"],
    opts: { test: "vitest|jest", validation: "zod|typebox", logger: "pino" },
  },
  {
    name: "nestjs-prisma",
    match: (ctx) => ctx.framework === "NestJS" && ctx.orm === "Prisma",
    deps: ["@nestjs/core", "@prisma/client"],
    opts: { test: "vitest|jest", validation: "class-validator|zod" },
  },
  {
    name: "nestjs-postgres",
    match: (ctx) => ctx.framework === "NestJS" && ctx.database === "PostgreSQL" && (ctx.orm === "native" || ctx.orm === "TypeORM"),
    deps: ["@nestjs/core", "pg"],
    opts: { test: "vitest|jest", validation: "class-validator|zod" },
  },
  {
    name: "nestjs-mongodb",
    match: (ctx) => ctx.framework === "NestJS" && ctx.database === "MongoDB" && ctx.orm === "Mongoose",
    deps: ["@nestjs/core", "mongoose"],
    opts: { test: "vitest|jest", validation: "class-validator|zod" },
  },
];

function readPkg() {
  try {
    const raw = readFileSync(join(ROOT, "package.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function findInstalled(depPattern, pkg) {
  if (!pkg) return false;
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  const parts = depPattern.split("|");
  return parts.some((p) => all[p]);
}

export function detectProfile(ctx) {
  for (const profile of PROFILES) {
    if (profile.match(ctx)) return profile.name;
  }
  if (ctx.framework !== "unknown") {
    return `${ctx.framework.toLowerCase()}-${ctx.database.toLowerCase()}`;
  }
  return "unknown";
}

export function detectProfileExtended(ctx) {
  const profile = detectProfile(ctx);
  const profileDef = PROFILES.find((p) => p.name === profile);

  const pkg = readPkg();
  const diStrategy = ctx.diStrategy || "manual";
  const hasPlatform = ctx.platform?.exists || false;
  const hasShared = ctx.shared?.exists || false;
  const hasInfra = ctx.infra?.exists || false;
  const platformComponents = ctx.platform?.components || [];

  // Detección de librerías complementarias
  const hasTest = pkg ? findInstalled("vitest|jest|mocha|ava", pkg) : false;
  const hasValidation = pkg ? findInstalled("zod|joi|class-validator|typebox|yup", pkg) : false;
  const hasLogger = pkg ? findInstalled("pino|winston|log4js", pkg) : false;
  const hasAuth = pkg ? findInstalled("bcrypt|argon2|jsonwebtoken|jose|passport", pkg) : false;
  const hasHelmet = pkg ? findInstalled("helmet|cors", pkg) : false;
  const hasRateLimit = pkg ? findInstalled("express-rate-limit|rate-limiter-flexible|@fastify/rate-limit", pkg) : false;
  const hasSwagger = pkg ? findInstalled("swagger-ui-express|@nestjs/swagger|@fastify/swagger|openapi", pkg) : false;
  const hasEvents = pkg ? findInstalled("eventemitter3|kafkajs|amqplib|ioredis|bull|bullmq|@nestjs/event-emitter", pkg) : false;

  // Sugerencias de paquetes faltantes
  const suggestions = [];
  if (!hasTest) suggestions.push("Agregar framework de testing: vitest o jest");
  if (!hasValidation) suggestions.push("Agregar validación: zod o class-validator");
  if (!hasLogger) suggestions.push("Agregar logger: pino (recomendado) o winston");
  if (!hasAuth) suggestions.push("Agregar autenticación: bcrypt + jsonwebtoken o jose");
  if (!hasHelmet) suggestions.push("Agregar seguridad HTTP: helmet + cors");
  if (!hasRateLimit) suggestions.push("Agregar rate limiting: express-rate-limit o rate-limiter-flexible");
  if (!hasSwagger) suggestions.push("Agregar documentación API: OpenAPI con zod-to-openapi o @nestjs/swagger");
  if (!hasEvents) suggestions.push("Agregar event bus: eventemitter3 (local) o kafkajs (distribuido)");

  // Validación de dependencias del perfil detectado
  const depIssues = [];
  if (profileDef && pkg) {
    for (const dep of profileDef.deps) {
      if (!findInstalled(dep, pkg)) {
        depIssues.push(`Falta dependencia requerida: ${dep}`);
      }
    }
  }

  return {
    profile,
    hasPlatform,
    hasShared,
    hasInfra,
    platformComponents,
    diStrategy,
    layers: {
      platform: hasPlatform,
      features: ctx.hasFeaturesDir || false,
      shared: hasShared,
      infra: hasInfra,
    },
    complementary: {
      test: hasTest,
      validation: hasValidation,
      logger: hasLogger,
      auth: hasAuth,
      helmet: hasHelmet,
      rateLimit: hasRateLimit,
      swagger: hasSwagger,
      events: hasEvents,
    },
    suggestions,
    depIssues,
  };
}

async function main() {
  const ctx = await buildContext();
  const profile = detectProfile(ctx);
  const extended = detectProfileExtended(ctx);
  const args = process.argv.slice(2);

  if (args.includes("--extended")) {
    console.log(JSON.stringify(extended, null, 2));
  } else if (args.includes("--suggest")) {
    if (extended.suggestions.length === 0 && extended.depIssues.length === 0) {
      console.log(`✓ Perfil "${profile}" — todas las dependencias y complementos detectados`);
    } else {
      if (extended.depIssues.length > 0) {
        console.log(`⚠ Perfil "${profile}" — problemas de dependencias:`);
        extended.depIssues.forEach((d) => console.log(`   ✘ ${d}`));
      }
      if (extended.suggestions.length > 0) {
        console.log(`\n💡 Sugerencias para complementar "${profile}":`);
        extended.suggestions.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));
      }
    }
  } else {
    console.log(profile);
  }
}

if (process.argv[1] && (process.argv[1].endsWith("profile.mjs") || process.argv[1].endsWith("profile.js"))) {
  main().catch(console.error);
}
