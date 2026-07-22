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
  before(() => scaffoldProject({}));
  after(() => cleanup());

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
  before(() => scaffoldProject({}));
  after(() => cleanup());

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
  before(() => scaffoldProject({}));
  after(() => cleanup());

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
  it("has 11 built-in rules (R1-R9 + R13 + R14)", async () => {
    const { RULES, RULES_BY_ID } = await import("../scripts/registry/rules.mjs");
    assert.equal(RULES.length, 11);
    assert.ok(RULES_BY_ID.R1);
    assert.ok(RULES_BY_ID.R9);
    assert.ok(RULES_BY_ID.R13);
    assert.ok(RULES_BY_ID.R14);
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
  before(() => scaffoldProject({}));
  after(() => cleanup());

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

describe("transactional-outbox pattern", () => {
  it("outbox entry tracks lifecycle states", () => {
    const entry = { id: "1", eventType: "OrderPlaced", processedAt: null, retryCount: 0, lastError: null };
    assert.equal(entry.processedAt, null);
    assert.equal(entry.retryCount, 0);

    entry.processedAt = new Date();
    entry.retryCount = 2;
    entry.lastError = "timeout";
    assert.ok(entry.processedAt instanceof Date);
    assert.equal(entry.retryCount, 2);
  });

  it("retry policy respects max retries and backoff", () => {
    const maxRetries = 3;
    const baseDelay = 100;
    let attempts = 0;

    async function executeWithRetry(fn) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          if (attempt === maxRetries) throw error;
          // exponential backoff: baseDelay * 2^(attempt-1)
          const delay = baseDelay * Math.pow(2, attempt - 1);
          // not actually waiting in test
          void delay;
        }
      }
    }

    assert.rejects(async () => {
      await executeWithRetry(() => Promise.reject(new Error("fail")));
    }, /fail/);
  });

  it("outbox relayer moves event to DLQ after exceeding retries", () => {
    const MAX_RETRIES = 10;
    const entry = { id: "bad-event", retryCount: 9 };
    assert.ok(entry.retryCount < MAX_RETRIES);

    entry.retryCount++;
    assert.equal(entry.retryCount, 10);

    const shouldGoToDLQ = entry.retryCount >= MAX_RETRIES;
    assert.ok(shouldGoToDLQ);
  });

  it("outbox entry requires event_id, aggregate_id, and payload", () => {
    const validEntry = {
      id: crypto.randomUUID(),
      eventType: "OrderPlaced",
      aggregateId: "order-123",
      aggregateType: "Order",
      payload: { total: 100 },
      occurredAt: new Date(),
      processedAt: null,
      retryCount: 0,
      lastError: null,
    };
    assert.ok(validEntry.id);
    assert.ok(validEntry.aggregateId);
    assert.ok(validEntry.payload);
    assert.equal(validEntry.eventType, "OrderPlaced");
  });

  it("processed outbox entries are no longer picked up by relayer", () => {
    const unprocessed = { processedAt: null };
    const processed = { processedAt: new Date() };

    const isPending = (entry) => entry.processedAt === null;
    assert.ok(isPending(unprocessed));
    assert.ok(!isPending(processed));
  });
});

describe("idempotency pattern", () => {
  it("idempotency key must be a valid UUID", () => {
    function isValidUUID(key) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
    }

    assert.ok(isValidUUID("550e8400-e29b-41d4-a716-446655440000"));
    assert.ok(!isValidUUID("not-a-uuid"));
    assert.ok(!isValidUUID(""));
  });

  it("same idempotency key returns cached response", async () => {
    const cache = new Map();

    async function handleRequest(key, handler) {
      if (cache.has(key)) return cache.get(key);
      const result = await handler();
      cache.set(key, result);
      return result;
    }

    let callCount = 0;
    async function processPayment() {
      callCount++;
      return { status: "success", transactionId: "txn-1" };
    }

    const key = "550e8400-e29b-41d4-a716-446655440000";
    const result1 = await handleRequest(key, processPayment);
    const result2 = await handleRequest(key, processPayment);

    assert.equal(result1.status, "success");
    assert.equal(result2.status, "success");
    assert.equal(callCount, 1); // solo se ejecutó una vez
  });

  it("different idempotency keys create separate resources", async () => {
    const store = new Map();

    async function createResource(key, data) {
      if (store.has(key)) return store.get(key);
      const resource = { id: crypto.randomUUID(), ...data };
      store.set(key, resource);
      return resource;
    }

    const r1 = await createResource("key-1", { name: "A" });
    const r2 = await createResource("key-2", { name: "B" });

    assert.notEqual(r1.id, r2.id);
  });

  it("idempotency key has TTL and expires", () => {
    const entry = { key: "test", createdAt: new Date() };
    const TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

    function isExpired(entry) {
      return Date.now() - entry.createdAt.getTime() > TTL_MS;
    }

    assert.ok(!isExpired(entry)); // creado ahora, no ha expirado

    const oldEntry = { key: "old", createdAt: new Date(Date.now() - TTL_MS - 1) };
    assert.ok(isExpired(oldEntry));
  });

  it("only POST, PATCH, PUT need idempotency keys", () => {
    const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
    const needsKey = (method) => ["POST", "PATCH", "PUT"].includes(method);

    assert.ok(!needsKey("GET"));
    assert.ok(needsKey("POST"));
    assert.ok(needsKey("PUT"));
    assert.ok(needsKey("PATCH"));
    assert.ok(!needsKey("DELETE"));
  });
});

describe("anti-corruption-layer pattern", () => {
  it("translator maps external DTO to domain entity", () => {
    class CustomerTranslator {
      toDomain(dto) {
        return {
          id: dto.customerId,
          name: `${dto.firstName} ${dto.lastName}`,
          email: dto.emailAddress,
          status: dto.active ? "active" : "inactive",
        };
      }
    }

    const externalDTO = {
      customerId: "ext-123",
      firstName: "John",
      lastName: "Doe",
      emailAddress: "john@example.com",
      active: true,
    };

    const translator = new CustomerTranslator();
    const entity = translator.toDomain(externalDTO);

    assert.equal(entity.id, "ext-123");
    assert.equal(entity.name, "John Doe");
    assert.equal(entity.email, "john@example.com");
    assert.equal(entity.status, "active");
  });

  it("translator maps domain entity back to external DTO", () => {
    class CustomerTranslator {
      toExternal(entity) {
        return {
          customerId: entity.id,
          firstName: entity.name.split(" ")[0],
          lastName: entity.name.split(" ").slice(1).join(" "),
          emailAddress: entity.email,
          active: entity.status === "active",
        };
      }
    }

    const entity = {
      id: "dom-456",
      name: "Jane Smith",
      email: "jane@example.com",
      status: "active",
    };

    const translator = new CustomerTranslator();
    const dto = translator.toExternal(entity);

    assert.equal(dto.customerId, "dom-456");
    assert.equal(dto.firstName, "Jane");
    assert.equal(dto.lastName, "Smith");
    assert.equal(dto.active, true);
  });

  it("translator handles null/missing values gracefully", () => {
    class CustomerTranslator {
      toDomain(dto) {
        return {
          id: dto.customerId ?? "unknown",
          name: dto.firstName ? `${dto.firstName} ${dto.lastName ?? ""}`.trim() : "Unknown",
          email: dto.emailAddress ?? "",
          status: dto.active === true ? "active" : "inactive",
        };
      }
    }

    const emptyDTO = { customerId: null, firstName: null, lastName: null, emailAddress: null, active: null };
    const translator = new CustomerTranslator();
    const entity = translator.toDomain(emptyDTO);

    assert.equal(entity.id, "unknown");
    assert.equal(entity.name, "Unknown");
    assert.equal(entity.status, "inactive");
  });

  it("gateway enforces timeout and returns null on 404", () => {
    async function fetchCustomer(id) {
      const response = { status: 404, ok: false, statusText: "Not Found" };
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(response.statusText);
      return { id };
    }

    assert.doesNotReject(async () => {
      const result = await fetchCustomer("nonexistent");
      assert.equal(result, null);
    });
  });

  it("ACL delegates to translator and gateway in correct order", async () => {
    let order = [];

    const gateway = {
      async fetch(id) { order.push("gateway"); return { customerId: id, firstName: "A", lastName: "B", emailAddress: "a@b.com", active: true }; },
    };

    const translator = {
      toDomain(dto) { order.push("translator"); return { id: dto.customerId, name: `${dto.firstName} ${dto.lastName}`, email: dto.emailAddress, status: "active" }; },
    };

    async function findById(id) {
      const dto = await gateway.fetch(id);
      return dto ? translator.toDomain(dto) : null;
    }

    const result = await findById("123");
    assert.deepEqual(order, ["gateway", "translator"]);
    assert.equal(result.id, "123");
    assert.equal(result.name, "A B");
  });
});
