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

export function detectProfileExtended(ctx) {
  const profile = detectProfile(ctx);

  const diStrategy = ctx.diStrategy || "manual";
  const hasPlatform = ctx.platform?.exists || false;
  const hasShared = ctx.shared?.exists || false;
  const hasInfra = ctx.infra?.exists || false;
  const platformComponents = ctx.platform?.components || [];

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
  };
}

async function main() {
  const ctx = await buildContext();
  const profile = detectProfile(ctx);
  const extended = detectProfileExtended(ctx);
  const args = process.argv.slice(2);
  if (args.includes("--extended")) {
    console.log(JSON.stringify(extended, null, 2));
  } else {
    console.log(profile);
  }
}

if (process.argv[1] && (process.argv[1].endsWith("profile.mjs") || process.argv[1].endsWith("profile.js"))) {
  main().catch(console.error);
}
