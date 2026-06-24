#!/usr/bin/env node

import { buildContext } from "./context.mjs";

const PROFILES = [
  {
    name: "express-mongodb",
    match: (ctx) =>
      ctx.framework === "Express" &&
      ctx.database === "MongoDB" &&
      ctx.orm === "Mongoose",
  },
  {
    name: "express-prisma",
    match: (ctx) =>
      ctx.framework === "Express" &&
      ctx.orm === "Prisma",
  },
  {
    name: "express-postgres",
    match: (ctx) =>
      ctx.framework === "Express" &&
      ctx.database === "PostgreSQL" &&
      ctx.orm === "native",
  },
  {
    name: "fastify-postgres",
    match: (ctx) =>
      ctx.framework === "Fastify" &&
      ctx.database === "PostgreSQL" &&
      ctx.orm === "Prisma",
  },
  {
    name: "nestjs-prisma",
    match: (ctx) =>
      ctx.framework === "NestJS" &&
      ctx.orm === "Prisma",
  },
];

export function detectProfile(ctx) {
  for (const profile of PROFILES) {
    if (profile.match(ctx)) return profile.name;
  }

  if (ctx.framework !== "unknown") {
    return `${ctx.framework.toLowerCase()}-${ctx.database.toLowerCase()}`;
  }

  return "unknown";
}

async function main() {
  const ctx = await buildContext();
  const profile = detectProfile(ctx);
  console.log(profile);
}

if (process.argv[1] && (process.argv[1].endsWith("profile.mjs") || process.argv[1].endsWith("profile.js"))) {
  main().catch(console.error);
}
