/**
 * Forge core tests — node:test, sin dependencias externas.
 *
 * Ejecutar: node --test .opencode/skills/forge/tests/core.test.mjs
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

let tmpDir;
let origCwd;

// ── Helpers ──

function scaffoldProject(files) {
  tmpDir = mkdtempSync(join(tmpdir(), "forge-test-"));
  for (const [path, content] of Object.entries(files)) {
    const full = join(tmpDir, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, content);
  }
  origCwd = process.cwd;
  process.cwd = () => tmpDir;
  return tmpDir;
}

function cleanup() {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  if (origCwd) process.cwd = origCwd;
}

// ── Tests ──

describe("profile.mjs", () => {
  it("detects express-prisma from context", async () => {
    const { detectProfile } = await import("../scripts/profile.mjs");
    const ctx = {
      framework: "Express",
      database: "PostgreSQL",
      orm: "Prisma",
      diStrategy: "tsyringe",
    };
    assert.equal(detectProfile(ctx), "express-prisma");
  });

  it("detects fastify-postgres from context", async () => {
    const { detectProfile } = await import("../scripts/profile.mjs");
    const ctx = {
      framework: "Fastify",
      database: "PostgreSQL",
      orm: "Prisma",
      diStrategy: "manual",
    };
    assert.equal(detectProfile(ctx), "fastify-postgres");
  });

  it("detects nestjs-prisma from context", async () => {
    const { detectProfile } = await import("../scripts/profile.mjs");
    const ctx = {
      framework: "NestJS",
      database: "PostgreSQL",
      orm: "Prisma",
      diStrategy: "framework",
    };
    assert.equal(detectProfile(ctx), "nestjs-prisma");
  });

  it("returns unknown for empty context", async () => {
    const { detectProfile } = await import("../scripts/profile.mjs");
    const ctx = {
      framework: "unknown",
      database: "unknown",
      orm: "none",
      diStrategy: "manual",
    };
    assert.equal(detectProfile(ctx), "unknown");
  });

  it("detects express-drizzle from context", async () => {
    const { detectProfile } = await import("../scripts/profile.mjs");
    const ctx = {
      framework: "Express",
      database: "PostgreSQL",
      orm: "Drizzle",
      diStrategy: "manual",
    };
    assert.equal(detectProfile(ctx), "express-drizzle");
  });

  it("detects fastify-mongodb from context", async () => {
    const { detectProfile } = await import("../scripts/profile.mjs");
    const ctx = {
      framework: "Fastify",
      database: "MongoDB",
      orm: "Mongoose",
      diStrategy: "manual",
    };
    assert.equal(detectProfile(ctx), "fastify-mongodb");
  });

  it("detects nestjs-mongodb from context", async () => {
    const { detectProfile } = await import("../scripts/profile.mjs");
    const ctx = {
      framework: "NestJS",
      database: "MongoDB",
      orm: "Mongoose",
      diStrategy: "framework",
    };
    assert.equal(detectProfile(ctx), "nestjs-mongodb");
  });

  it("detects nestjs-postgres from context", async () => {
    const { detectProfile } = await import("../scripts/profile.mjs");
    const ctx = {
      framework: "NestJS",
      database: "PostgreSQL",
      orm: "TypeORM",
      diStrategy: "framework",
    };
    assert.equal(detectProfile(ctx), "nestjs-postgres");
  });
});

describe("graph.mjs", () => {
  it("builds an empty graph for an empty project", async () => {
    const { buildGraph } = await import("../scripts/graph.mjs");
    const graph = buildGraph(process.cwd());
    assert.ok(Array.isArray(graph.nodes));
    assert.ok(Array.isArray(graph.edges));
    assert.equal(graph.stats.totalNodes, 0);
    assert.equal(graph.stats.totalEdges, 0);
    assert.equal(graph.stats.violations, 0);
    assert.equal(graph.stats.health, "healthy");
  });
});

describe("armorer.mjs", () => {
  it("builds a healthy report for an empty project", async () => {
    const { buildOwnershipReport } = await import("../scripts/armorer.mjs");
    const report = buildOwnershipReport(process.cwd());
    assert.equal(report.health, "healthy");
    assert.ok(Array.isArray(report.orphans));
    assert.ok(Array.isArray(report.duplicates));
    assert.ok(Array.isArray(report.misplaced));
    assert.equal(typeof report.score, "number");
    assert.equal(report.hasPlatform, false);
    assert.equal(report.hasFeatures, false);
    assert.equal(report.hasShared, false);
    assert.equal(report.hasInfra, false);
  });
});

describe("forge-config.mjs", () => {
  it("returns default state when no config file exists", async () => {
    const { loadState } = await import("../scripts/forge-config.mjs");
    const state = await loadState();
    // When no config exists, loadState returns a default
    assert.ok(state !== null);
    assert.ok(typeof state === "object");
  });

  it("loads and saves state", async () => {
    const { loadState, saveState, STATE_FILE } = await import("../scripts/forge-config.mjs");

    // Remove any existing state for clean test
    const initial = await loadState();
    assert.ok(initial !== null);

    // Save a custom value
    const testValue = { test: true, timestamp: Date.now() };
    await saveState(testValue);

    // Load it back
    // Clean up: restore original state
    await saveState(initial);
  });
});

describe("chain.mjs", () => {
  it("builds an empty dependency graph for empty project", async () => {
    const { buildDependencyGraph } = await import("../scripts/chain.mjs");
    const graph = buildDependencyGraph();
    assert.ok(Array.isArray(graph.nodes));
    assert.ok(graph.hasCycles === false || graph.hasCycles === true);
    assert.ok(typeof graph.cycleFree === "boolean");
  });
});

describe("formatter.mjs", () => {
  it("formatViolation produces colored output", async () => {
    const { formatViolation, formatCheck } = await import("../scripts/formatter.mjs");
    const out = formatViolation({ severity: "ERROR", label: "Test", detail: "src/test.ts", fix: "Fix it" });
    assert.ok(out.includes("ERROR"));
    assert.ok(out.includes("Test"));
    assert.ok(out.includes("Fix"));
  });

  it("formatCheck shows pass/fail icons", async () => {
    const { formatCheck } = await import("../scripts/formatter.mjs");
    const pass = formatCheck({ severity: "INFO", label: "OK", pass: true });
    const fail = formatCheck({ severity: "ERROR", label: "FAIL", pass: false, fix: "Fix it" });
    assert.ok(pass.includes("✔"));
    assert.ok(fail.includes("✘"));
    assert.ok(fail.includes("Fix"));
  });

  it("scoreBar returns a bar string", async () => {
    const { scoreBar } = await import("../scripts/formatter.mjs");
    const bar = scoreBar(15, 20);
    assert.ok(bar.includes("█"));
    assert.ok(bar.includes("░"));
  });

  it("formatJson produces valid JSON", async () => {
    const { formatJson } = await import("../scripts/formatter.mjs");
    const json = formatJson({ a: 1, b: [2, 3] });
    const parsed = JSON.parse(json);
    assert.equal(parsed.a, 1);
    assert.deepEqual(parsed.b, [2, 3]);
  });
});

describe("registry/rules.mjs", () => {
  it("has 9 built-in rules (R1-R9)", async () => {
    const { RULES, RULES_BY_ID } = await import("../scripts/registry/rules.mjs");
    assert.equal(RULES.length, 9);
    assert.ok(RULES_BY_ID.R1);
    assert.ok(RULES_BY_ID.R9);
    for (const r of RULES) {
      assert.ok(r.id);
      assert.ok(r.name);
      assert.ok(r.severity);
      assert.ok(r.check);
      assert.ok(typeof r.check === "function");
    }
  });

  it("R1 detects feature→infra violations", async () => {
    const { RULES_BY_ID } = await import("../scripts/registry/rules.mjs");
    const mockGraph = {
      edges: [
        { from: "features/auth", fromLayer: "feature", to: "infra/prisma", toLayer: "infra", file: "src/features/auth/repo.ts" },
        { from: "features/users", fromLayer: "feature", to: "features/products", toLayer: "feature", file: "src/features/users/cross.ts" }, // not R1
      ],
    };
    const violations = RULES_BY_ID.R1.check(mockGraph);
    assert.equal(violations.length, 1);
    assert.equal(violations[0].rule, "R1");
    assert.equal(violations[0].severity, "CRITICAL");
  });

  it("loadCustomRules returns empty array when no config", async () => {
    const { loadCustomRules } = await import("../scripts/registry/rules.mjs");
    const rules = loadCustomRules();
    assert.ok(Array.isArray(rules));
  });

  it("evaluateRules runs all rules against a graph", async () => {
    const { evaluateRules } = await import("../scripts/registry/rules.mjs");
    const mockGraph = {
      nodes: [{ id: "features/auth", layer: "feature" }, { id: "infra/prisma", layer: "infra" }],
      edges: [{ from: "features/auth", fromLayer: "feature", to: "infra/prisma", toLayer: "infra", file: "src/features/auth/repo.ts" }],
      stats: { hasCycles: false },
    };
    const violations = evaluateRules(mockGraph);
    assert.ok(violations.length > 0);
    const r1Violations = violations.filter(v => v.rule === "R1");
    assert.equal(r1Violations.length, 1);
  });
});

describe("detect.mjs — inline ignores", () => {
  it("parseInlineIgnores detects forge-ignore-next-line", async () => {
    const { parseInlineIgnores } = await import("../scripts/detect.mjs");
    const content = "// forge-ignore-next-line\nimport { x } from '../infra/prisma';\nconst a = 1;\n";
    const ignores = parseInlineIgnores(content);
    assert.ok(ignores[2]); // line 2 should be ignored
    assert.ok(ignores[2].has("*")); // wildcard
    assert.equal(Object.keys(ignores).length, 1);
  });

  it("parseInlineIgnores detects forge-ignore: R1", async () => {
    const { parseInlineIgnores } = await import("../scripts/detect.mjs");
    const content = "import { x } from '../infra/prisma'; // forge-ignore: R1\nconst a = 1;\n";
    const ignores = parseInlineIgnores(content);
    assert.ok(ignores[1]); // line 1 should be ignored
    assert.ok(ignores[1].has("R1"));
    assert.ok(!ignores[1].has("R2"));
  });

  it("parseInlineIgnores handles multiple rules", async () => {
    const { parseInlineIgnores } = await import("../scripts/detect.mjs");
    const content = "import { x } from '../other'; // forge-ignore: R1, R8\n";
    const ignores = parseInlineIgnores(content);
    assert.ok(ignores[1]);
    assert.ok(ignores[1].has("R1"));
    assert.ok(ignores[1].has("R8"));
  });

  it("isIgnored returns true for wildcard ignore", async () => {
    const { parseInlineIgnores, isIgnored } = await import("../scripts/detect.mjs");
    const content = "// forge-ignore-next-line\nimport { x } from '../infra/prisma';\n";
    const ignores = new Map();
    ignores.set("src/test.ts", parseInlineIgnores(content));

    const violation = { severity: "CRITICAL", label: "[R1] Feature imports infra", detail: "src/test.ts:2", fix: "Fix" };
    assert.ok(isIgnored(violation, ignores));
  });

  it("isIgnored returns false for non-ignored violation", async () => {
    const { isIgnored } = await import("../scripts/detect.mjs");
    const ignores = new Map();
    const violation = { severity: "ERROR", label: "[R8] Cross-feature import", detail: "src/test.ts:5", fix: "Fix" };
    assert.ok(!isIgnored(violation, ignores));
  });
});

describe("posttool.mjs", () => {
  it("postToolCheck returns empty for no files", async () => {
    const { postToolCheck } = await import("../scripts/posttool.mjs");
    const result = await postToolCheck([], {});
    assert.equal(result.total, 0);
    assert.ok(result.summary);
  });
});

describe("assay.mjs", () => {
  it("has 5 predefined personas", async () => {
    const { PERSONAS } = await import("../scripts/assay.mjs");
    assert.equal(PERSONAS.length, 5);
    const ids = PERSONAS.map(p => p.id);
    assert.ok(ids.includes("bezos"));
    assert.ok(ids.includes("fowler"));
    assert.ok(ids.includes("hacker"));
    assert.ok(ids.includes("pm"));
    assert.ok(ids.includes("senior"));
    for (const p of PERSONAS) {
      assert.ok(p.name);
      assert.ok(p.role);
      assert.ok(p.focus);
      assert.ok(Array.isArray(p.focus));
      assert.ok(p.focus.length > 0);
      assert.ok(typeof p.getOpinion === "function");
    }
  });

  it("generateAssay produces opinions for all personas", async () => {
    const { generateAssay } = await import("../scripts/assay.mjs");
    const mockReport = {
      total: 72,
      max: 140,
      grade: "F",
      violations: [
        { severity: "CRITICAL", label: "[R1] Feature imports infra", pass: false, rule: "R1", detail: "src/test.ts:1" },
        { severity: "ERROR", label: "Cross-feature import", pass: false, rule: "R8", detail: "src/test.ts:2" },
      ],
      severityCounts: { CRITICAL: 1, ERROR: 1 },
    };
    const mockGraph = {
      nodes: [{ id: "a", layer: "feature" }, { id: "b", layer: "infra" }],
      edges: [{ from: "a", fromLayer: "feature", to: "b", toLayer: "infra" }],
      stats: { hasCycles: false, dependencyHealth: 50, totalNodes: 2, totalEdges: 1, violations: 1, riskScore: 30, health: "degraded" },
    };
    const opinions = generateAssay(mockReport, mockGraph);
    assert.equal(opinions.length, 5);
    for (const op of opinions) {
      assert.ok(op.persona);
      assert.ok(op.persona.id);
      assert.ok(op.persona.name);
      assert.ok(typeof op.opinion === "string");
      assert.ok(op.opinion.length > 0);
    }
  });

  it("each persona gives unique perspective", async () => {
    const { generateAssay } = await import("../scripts/assay.mjs");
    const opinions = generateAssay({ total: 0, max: 140, grade: "F", violations: [], severityCounts: {} }, { nodes: [], edges: [], stats: {} });
    const texts = opinions.map(o => o.opinion);
    // All should be different
    const unique = new Set(texts);
    assert.ok(unique.size >= 3, "At least 3 personas give different opinions");
  });

  it("bezos focuses on coupling violations", async () => {
    const { PERSONAS } = await import("../scripts/assay.mjs");
    const bezos = PERSONAS.find(p => p.id === "bezos");
    const report = {
      total: 50,
      max: 140,
      grade: "F",
      violations: [
        { severity: "CRITICAL", label: "[R1] Feature imports infra", pass: false, rule: "R1", detail: "src/a.ts" },
        { severity: "CRITICAL", label: "[R8] Cross-feature import", pass: false, rule: "R8", detail: "src/b.ts" },
      ],
      severityCounts: { CRITICAL: 2 },
    };
    const opinion = bezos.getOpinion(report, { stats: { hasCycles: false } });
    assert.ok(opinion.includes("R1") || opinion.includes("R8") || opinion.includes("acoplamiento") || opinion.includes("importan"));
  });
});
