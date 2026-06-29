#!/usr/bin/env node

import { join, basename } from "path";
import { writeFileSync, existsSync } from "fs";
import { buildContext } from "./context.mjs";
import { detectProfile, detectProfileExtended } from "./profile.mjs";
import { getGraph, exportGraph } from "./graph.mjs";
import { buildOwnershipReport } from "./armorer.mjs";
import { allChecks } from "./detect.mjs";

const ROOT = process.cwd();

function formatDate() {
  return new Date().toISOString().slice(0, 10);
}

function generateMd(ctx, profile, graph, ownership, auditScore) {
  const sections = [];

  sections.push("# Architecture State\n");
  sections.push(`**Project Name:** ${ctx.projectName}  `);
  sections.push(`**Framework:** ${ctx.framework}  `);
  sections.push(`**Runtime:** ${ctx.runtime}  `);
  sections.push(`**Database:** ${ctx.database}  `);
  sections.push(`**ORM:** ${ctx.orm}  `);
  sections.push(`**DI Strategy:** ${ctx.diStrategy}  `);
  sections.push(`**Profile:** ${profile}  `);
  sections.push(`**Architecture:** hexagonal-feature (Platform + Features + Shared + Infra)  `);
  sections.push(`**Last Audit:** ${formatDate()} (score: ${auditScore}/100)  `);
  sections.push("");

  /* Platform */
  sections.push("## Platform\n");
  if (ctx.platform && ctx.platform.exists && ctx.platform.components.length > 0) {
    for (const comp of ctx.platform.components) {
      sections.push(`- \`platform/${comp}/\``);
    }
  } else {
    sections.push("*(No detectado)*");
  }
  sections.push("");

  /* Features */
  sections.push("## Features\n");
  if (ctx.features.migrated.length > 0) {
    for (const feat of ctx.features.migrated) {
      sections.push(`- \`features/${feat}/\``);
    }
  }
  if (ctx.features.legacy.length > 0) {
    sections.push("\n### Legacy\n");
    for (const feat of ctx.features.legacy) {
      sections.push(`- \`${feat}\` (legacy)`);
    }
  }
  if (ctx.features.migrated.length === 0 && ctx.features.legacy.length === 0) {
    sections.push("*(No detectado)*");
  }
  sections.push("");

  /* Shared */
  sections.push("## Shared\n");
  if (ctx.shared && ctx.shared.exists && ctx.shared.components.length > 0) {
    for (const comp of ctx.shared.components) {
      sections.push(`- \`shared/${comp}/\``);
    }
  } else {
    sections.push("*(No detectado)*");
  }
  sections.push("");

  /* Infrastructure */
  sections.push("## Infrastructure\n");
  if (ctx.infra && ctx.infra.exists && ctx.infra.components.length > 0) {
    for (const comp of ctx.infra.components) {
      sections.push(`- \`infra/${comp}/\``);
    }
  } else {
    sections.push("*(No detectado)*");
  }
  sections.push("");

  /* Ownership */
  sections.push("## Ownership\n");
  sections.push(`**Health:** ${ownership.health}  `);
  sections.push(`**Score:** ${ownership.score}/100  `);
  sections.push(`**Orphans:** ${ownership.orphans.length}  `);
  sections.push(`**Duplicates:** ${ownership.duplicates.length}  `);
  sections.push(`**Misplaced:** ${ownership.misplaced.length}  `);
  if (ownership.orphans.length > 0) {
    sections.push("\n### Orphans\n");
    for (const o of ownership.orphans) {
      sections.push(`- \`${o.path}\` — ${o.reason}`);
    }
  }
  sections.push("");

  /* Architecture Graph */
  sections.push(exportGraph(graph));

  /* Dependency Health */
  sections.push("## Dependency Health\n");
  sections.push(`**Valid Edges:** ${graph.edges.filter(e => e.type !== "violates").length}/${graph.edges.length}  `);
  sections.push(`**Dependency Health:** ${graph.stats.dependencyHealth}%  `);
  sections.push(`**Risk Score:** ${graph.stats.riskScore}/100  `);
  sections.push(`**Health:** ${graph.stats.health}  `);
  sections.push("");

  /* Violations */
  if (graph.violations.length > 0) {
    sections.push("## Violations\n");
    sections.push("| Rule | From | To | Severity | Description |\n");
    sections.push("|------|------|----|----------|-------------|\n");
    for (const v of graph.violations) {
      sections.push(`| ${v.rule} | \`${v.from}\` | \`${v.to}\` | ${v.severity} | ${v.description} |\n`);
    }
    sections.push("");
  }

  /* Context */
  sections.push("## Context\n");
  sections.push(`- **Has Src:** ${ctx.hasSrc}  `);
  sections.push(`- **Has Features Dir:** ${ctx.hasFeaturesDir}  `);
  sections.push(`- **Has Platform Dir:** ${ctx.hasPlatformDir}  `);
  sections.push(`- **Has Shared Dir:** ${ctx.hasSharedDir}  `);
  sections.push(`- **Has Infra Dir:** ${ctx.hasInfraDir}  `);
  sections.push(`- **Is Migrating:** ${ctx.isMigrating}  `);
  sections.push(`- **Is Fully Migrated:** ${ctx.isFullyMigrated}  `);
  sections.push(`- **Is Legacy:** ${ctx.isLegacy}  `);
  sections.push(`- **Is Greenfield:** ${ctx.isGreenfield}  `);
  sections.push(`- **Total Features:** ${ctx.features.total}  `);
  sections.push("");

  /* Tech Stack */
  sections.push("## Tech Stack\n");
  sections.push("| Component | Technology |\n");
  sections.push("|-----------|------------|\n");
  sections.push(`| Framework | ${ctx.framework} |\n`);
  sections.push(`| Runtime | ${ctx.runtime} |\n`);
  sections.push(`| Database | ${ctx.database} |\n`);
  sections.push(`| ORM | ${ctx.orm} |\n`);
  sections.push(`| DI Strategy | ${ctx.diStrategy} |\n`);
  sections.push(`| Profile | ${profile} |\n`);
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
  const graph = ctx.graph || getGraph();
  const ownership = buildOwnershipReport();
  const features = ctx.features.migrated;
  const result = allChecks(features, graph, ctx);

  const CAT_MAX = { structure: 30, layers: 25, decorators: 20, ownership: 20, platform: 15, dependencies: 15, graph: 20, customRules: 5, naming: 10 };
  const totalScore = (result.structure?.score || 0) + (result.layers?.score || 0)
    + (result.ownership?.score || 0) + (result.platform?.score || 0)
    + (result.dependencies?.score || 0) + (result.graph?.score || 0)
    + (result.decorators?.score || 0) + (result.customRules?.score || 0)
    + (result.naming?.score || 0);
  const maxScore = Object.values(CAT_MAX).reduce((a, b) => a + b, 0);
  const auditScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const md = generateMd(ctx, profile, graph, ownership, auditScore);
  writeFileSync(outputPath, md, "utf-8");

  console.log(`✓ ARCHITECTURE.md generado en ${outputPath}`);
  console.log(`  Score: ${auditScore}/100 | Violaciones: ${graph.stats.violations} | Risk: ${graph.stats.riskScore}`);
  console.log(`  Platform: ${ctx.platform.components.length} | Features: ${ctx.features.migrated.length} | Shared: ${ctx.shared.components.length} | Infra: ${ctx.infra.components.length}`);
}

if (process.argv[1] && (process.argv[1].endsWith("architecture.mjs") || process.argv[1].endsWith("architecture.js"))) {
  main().catch(console.error);
}
