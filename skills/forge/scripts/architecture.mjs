#!/usr/bin/env node

import { join, basename } from "path";
import { writeFileSync, existsSync } from "fs";
import { buildContext } from "./context.mjs";
import { detectProfile } from "./profile.mjs";
import { buildGraph, exportGraph } from "./graph.mjs";
import { allChecks } from "./detect.mjs";

const ROOT = process.cwd();

function formatDate() {
  return new Date().toISOString().slice(0, 10);
}

function generateMd(ctx, profile, graph, auditScore) {
  const sections = [];

  sections.push("# Architecture\n");
  sections.push(`Project Name: ${ctx.projectName}`);
  sections.push(`Framework: ${ctx.framework}`);
  sections.push(`Runtime: ${ctx.runtime}`);
  sections.push(`Database: ${ctx.database}`);
  sections.push(`ORM: ${ctx.orm}`);
  sections.push(`DI Strategy: ${ctx.diStrategy}`);
  sections.push(`Architecture: hexagonal-feature`);
  sections.push(`Feature Convention: PascalCase`);
  sections.push(`Naming Convention: camelCase`);
  sections.push(`Testing Strategy: unit (use cases) + integration (adapters)`);
  sections.push(`Cross Feature Rules: inyección de interfaces, no imports directos`);
  sections.push(`Dependency Rules: unidireccional, adapters → application → domain`);
  sections.push(`Active Profile: ${profile}`);
  sections.push(`Last Audit: ${formatDate()} (score: ${auditScore})`);
  sections.push(`Migrated Features: [${ctx.features.migrated.join(", ")}]`);
  sections.push(`Legacy Features: [${ctx.features.legacy.join(", ")}]`);
  sections.push("");

  sections.push("---\n");

  sections.push(exportGraph(graph));

  sections.push("---\n");

  sections.push("## Context\n");
  sections.push(`- **Has Src:** ${ctx.hasSrc}`);
  sections.push(`- **Has Features Dir:** ${ctx.hasFeaturesDir}`);
  sections.push(`- **Is Migrating:** ${ctx.isMigrating}`);
  sections.push(`- **Is Fully Migrated:** ${ctx.isFullyMigrated}`);
  sections.push(`- **Is Legacy:** ${ctx.isLegacy}`);
  sections.push(`- **Is Greenfield:** ${ctx.isGreenfield}`);
  sections.push(`- **Total Features:** ${ctx.features.total}`);
  sections.push("");

  sections.push("## Tech Stack\n");
  sections.push(`| Component | Technology |`);
  sections.push(`|-----------|------------|`);
  sections.push(`| Framework | ${ctx.framework} |`);
  sections.push(`| Runtime | ${ctx.runtime} |`);
  sections.push(`| Database | ${ctx.database} |`);
  sections.push(`| ORM | ${ctx.orm} |`);
  sections.push(`| DI Strategy | ${ctx.diStrategy} |`);
  sections.push(`| Profile | ${profile} |`);
  sections.push("");

  return sections.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const outputPath = args.includes("--output")
    ? args[args.indexOf("--output") + 1]
    : join(ROOT, "ARCHITECTURE.md");

  const ctx = await buildContext();
  const profile = detectProfile(ctx);
  const graph = buildGraph();
  const features = ctx.features.migrated;
  const result = allChecks(features, graph);

  const totalScore = result.structure.score + result.layers.score
    + result.decorators.score + result.legacy.score + result.config.score
    + (result.graph ? result.graph.score : 0);
  const maxScore = 30 + 25 + 20 + 15 + 10 + 20;
  const auditScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const md = generateMd(ctx, profile, graph, auditScore);
  writeFileSync(outputPath, md, "utf-8");

  console.log(`✓ ARCHITECTURE.md generado en ${outputPath}`);
  console.log(`  Score: ${auditScore}/100 | Violaciones: ${graph.stats.violations} | Risk: ${graph.stats.riskScore}`);
}

main().catch(console.error);
