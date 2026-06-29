#!/usr/bin/env node

import { join, relative, dirname, basename } from "path";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { parseImportPaths } from "./parse-imports.mjs";
import { saveCache, loadCache } from "./forge-config.mjs";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

const INFRA_PACKAGES = {
  "prisma": "infra:prisma",
  "@prisma/client": "infra:prisma",
  "mongoose": "infra:mongoose",
  "pg": "infra:pg",
  "mysql2": "infra:mysql",
  "redis": "infra:redis",
  "amqplib": "infra:rabbitmq",
  "kafka": "infra:kafka",
  "kafkajs": "infra:kafka",
  "@nestjs/core": "infra:nestjs",
  "express": "infra:express",
  "fastify": "infra:fastify",
  "typeorm": "infra:typeorm",
  "drizzle-orm": "infra:drizzle",
  "aws-sdk": "infra:aws",
  "@aws-sdk/client-s3": "infra:aws",
  "nodemailer": "infra:mail",
  "stripe": "infra:stripe",
  "bullmq": "infra:queue",
  "ioredis": "infra:redis",
};

const SEVERITY = { CRITICAL: "CRITICAL", ERROR: "ERROR", WARNING: "WARNING" };

function read(path) {
  try { return readFileSync(path, "utf-8"); }
  catch { return null; }
}

function exists(path) { return existsSync(path); }

function isDir(path) { return existsSync(path) && statSync(path).isDirectory(); }

function listDir(path) {
  try { return readdirSync(path); }
  catch { return []; }
}

function findFiles(dir, exts, maxDepth = 6) {
  const results = [];
  function walk(d, depth) {
    if (depth > maxDepth) return;
    try {
      for (const entry of readdirSync(d)) {
        const full = join(d, entry);
        if (statSync(full).isDirectory()) {
          walk(full, depth + 1);
        } else if (exts.some(e => entry.endsWith(e))) {
          results.push(full);
        }
      }
    } catch {}
  }
  if (existsSync(dir)) walk(dir, 0);
  return results;
}

function classifyPath(relPath) {
  const parts = relPath.split("/");
  if (parts.includes("platform")) return "platform";
  if (parts.includes("features")) {
    if (parts.includes("domain")) return "domain";
    if (parts.includes("adapters")) return "adapter";
    if (parts.includes("application")) return "application";
    return "feature";
  }
  if (parts.includes("shared") || parts.includes("core")) return "shared";
  if (parts.includes("infra") || parts.includes("infrastructure")) return "infra";
  if (parts.includes("adapters")) return "adapter";
  if (parts.includes("lib")) return "shared";
  return null;
}

function resolveNodeId(importPath, featureMap) {
  const featMatch = importPath.match(/features\/([^/]+)/);
  if (featMatch) {
    const featName = featMatch[1];
    if (featureMap[featName]) {
      if (importPath.includes("/domain/")) return `domain:${featName}`;
      if (importPath.includes("/adapters/")) return `adapter:${featName}`;
      return `feature:${featName}`;
    }
  }

  const platformMatch = importPath.match(/platform\/([^/]+)/);
  if (platformMatch) {
    const comp = platformMatch[1].replace(/\.(ts|js)$/, "");
    return `platform:${comp}`;
  }

  const sharedMatch = importPath.match(/shared\/([^/]+)/);
  if (sharedMatch) {
    const comp = sharedMatch[1].replace(/\.(ts|js)$/, "");
    return `shared:${comp}`;
  }

  const infraMatch = importPath.match(/infra(?:structure)?\/([^/]+)/);
  if (infraMatch) {
    const comp = infraMatch[1].replace(/\.(ts|js)$/, "");
    return `infra:${comp}`;
  }

  for (const [pkg, id] of Object.entries(INFRA_PACKAGES)) {
    if (importPath === pkg || importPath.startsWith(pkg + "/")) return id;
  }

  if (importPath.includes("/infrastructure/")) return "infra:infrastructure";
  if (importPath.includes("/infra/")) return "infra:infrastructure";

  if (importPath.includes("/core/") || importPath.startsWith("@/core")) return "shared:core";
  if (importPath.includes("/shared/") || importPath.startsWith("@/shared")) return "shared:shared";
  if (importPath.includes("/lib/")) return "shared:lib";

  if (importPath.includes("/adapters/")) return "adapter:global";

  return null;
}

function resolveRelativeImport(importPath, sourceFileRel, projectRoot) {
  if (!importPath.startsWith(".")) return null;
  const srcDir = dirname(join(projectRoot, sourceFileRel));
  const resolved = join(srcDir, importPath);
  return relative(projectRoot, resolved);
}

function extractNodeType(nodeId) {
  if (!nodeId) return null;
  return nodeId.split(":")[0];
}

export function buildGraph(projectRoot = ROOT) {
  const src = join(projectRoot, "src");
  const featuresDir = join(src, "features");
  const platformDir = join(src, "platform");
  const sharedDir = join(src, "shared");
  const infraDirs = [join(src, "infra"), join(src, "infrastructure")];

  const nodes = [];
  const edges = [];
  const violations = [];
  const featureMap = {};
  const idSet = new Set();
  const edgeSet = new Set();

  function addNode(id, type, label, path) {
    if (!idSet.has(id)) {
      nodes.push({ id, type, label, path });
      idSet.add(id);
    }
  }

  function addEdge(from, to, type, file, importPath) {
    const key = `${from}|${to}|${type}`;
    if (!edgeSet.has(key)) {
      edges.push({ from, to, type, file: file || null, import: importPath || null });
      edgeSet.add(key);
    }
  }

  /* ── 1. Platform Layer nodes ── */
  if (isDir(platformDir)) {
    for (const sub of listDir(platformDir)) {
      const full = join(platformDir, sub);
      if (isDir(full)) {
        addNode(`platform:${sub}`, "platform", sub, `src/platform/${sub}/`);
      } else if (sub.endsWith(".ts") || sub.endsWith(".js")) {
        const name = sub.replace(/\.(ts|js)$/, "");
        addNode(`platform:${name}`, "platform", name, `src/platform/${sub}`);
      }
    }
  }

  /* ── 2. Feature Layer nodes ── */
  const features = isDir(featuresDir)
    ? listDir(featuresDir).filter(f => isDir(join(featuresDir, f)))
    : [];

  for (const feat of features) {
    const featId = `feature:${feat}`;
    addNode(featId, "feature", feat, `src/features/${feat}/`);
    featureMap[feat] = featId;

    const domainPath = join(featuresDir, feat, "domain");
    if (isDir(domainPath)) {
      addNode(`domain:${feat}`, "domain", `${feat}/domain`, `src/features/${feat}/domain/`);
    }

    const adaptersPath = join(featuresDir, feat, "adapters");
    if (isDir(adaptersPath)) {
      addNode(`adapter:${feat}`, "adapter", `${feat}/adapters`, `src/features/${feat}/adapters/`);
    }
  }

  /* ── 3. Shared Layer nodes ── */
  if (isDir(sharedDir)) {
    for (const sub of listDir(sharedDir)) {
      const full = join(sharedDir, sub);
      if (isDir(full)) {
        addNode(`shared:${sub}`, "shared", sub, `src/shared/${sub}/`);
      } else if (sub.endsWith(".ts") || sub.endsWith(".js")) {
        const name = sub.replace(/\.(ts|js)$/, "");
        addNode(`shared:${name}`, "shared", name, `src/shared/${sub}`);
      }
    }
  }
  /* Also detect core and lib as shared */
  for (const dir of ["core", "lib"]) {
    const fullPath = join(src, dir);
    if (isDir(fullPath)) {
      addNode(`shared:${dir}`, "shared", dir, `src/${dir}/`);
    }
  }

  /* ── 4. Infra Layer nodes ── */
  for (const infraDir of infraDirs) {
    if (isDir(infraDir)) {
      for (const sub of listDir(infraDir)) {
        const full = join(infraDir, sub);
        if (isDir(full)) {
          addNode(`infra:${sub}`, "infra", sub, `src/${basename(infraDir)}/${sub}/`);
        } else if (sub.endsWith(".ts") || sub.endsWith(".js")) {
          const name = sub.replace(/\.(ts|js)$/, "");
          addNode(`infra:${name}`, "infra", name, `src/${basename(infraDir)}/${sub}`);
        }
      }
    }
  }

  /* ── 5. Global adapters node ── */
  const globalAdapters = join(src, "adapters");
  if (isDir(globalAdapters)) {
    addNode("adapter:global", "adapter", "adapters (global)", "src/adapters/");
  }

  /* ── 6. Scan files and build edges ── */
  const allFiles = findFiles(src, [".ts", ".js", ".tsx", ".jsx"], 8);
  const fileContents = allFiles.map(f => ({ file: f, content: read(f) })).filter(x => x.content);

  /* 6a. Detect used infra packages first */
  const usedPackages = new Set();
  for (const { file: filePath, content } of fileContents) {
    const gImports = parseImportPaths(content, filePath);
    for (const imp of gImports) {
      for (const [pkg, id] of Object.entries(INFRA_PACKAGES)) {
        if (imp === pkg || imp.startsWith(pkg + "/")) usedPackages.add(id);
      }
    }
  }
  for (const pkgId of usedPackages) {
    const label = pkgId.replace("infra:", "");
    addNode(pkgId, "infra", label, `(package) ${label}`);
  }

  /* 6b. Parse imports and create edges */
  for (const { file: filePath, content } of fileContents) {
    const relPath = relative(projectRoot, filePath);
    const sourceType = classifyPath(relPath);
    if (!sourceType) continue;

    let sourceId = null;
    const featMatch = relPath.match(/features\/([^/]+)/);

    if (featMatch) {
      const featName = featMatch[1];
      if (!featureMap[featName]) continue;
      if (sourceType === "domain") sourceId = `domain:${featName}`;
      else if (sourceType === "adapter") sourceId = `adapter:${featName}`;
      else if (sourceType === "application") sourceId = `feature:${featName}`;
      else sourceId = `feature:${featName}`;
    } else if (sourceType === "platform") {
      const platformComp = relPath.match(/platform\/([^/]+)/);
      if (platformComp) {
        const comp = platformComp[1].replace(/\.(ts|js)$/, "");
        sourceId = `platform:${comp}`;
      }
    } else if (sourceType === "shared") {
      const sharedComp = relPath.match(/(?:shared|core|lib)\/([^/]+)/);
      if (sharedComp) {
        const comp = sharedComp[1].replace(/\.(ts|js)$/, "");
        sourceId = `shared:${comp}`;
      } else {
        sourceId = "shared:shared";
      }
    } else if (sourceType === "infra") {
      const infraComp = relPath.match(/(?:infra|infrastructure)\/([^/]+)/);
      if (infraComp) {
        const comp = infraComp[1].replace(/\.(ts|js)$/, "");
        sourceId = `infra:${comp}`;
      } else {
        sourceId = "infra:infrastructure";
      }
    } else if (sourceType === "adapter") {
      sourceId = "adapter:global";
    }

    if (!sourceId || !idSet.has(sourceId)) continue;

    const gImports = parseImportPaths(content, filePath);
    const seenTargets = new Set();

    for (const imp of gImports) {
      let targetId = resolveNodeId(imp, featureMap);

      if (!targetId) {
        const resolved = resolveRelativeImport(imp, relPath, projectRoot);
        if (resolved) targetId = resolveNodeId(resolved, featureMap);
      }

      if (!targetId || targetId === sourceId) continue;
      if (!idSet.has(targetId)) continue;
      if (seenTargets.has(targetId)) continue;
      seenTargets.add(targetId);

      const fromType = extractNodeType(sourceId);
      const toType = extractNodeType(targetId);

      let edgeType = "uses";
      if (fromType === "adapter" && toType === "domain") edgeType = "implements";
      else if (fromType === "adapter" && toType === "infra") edgeType = "adapts_to";
      else if (toType === "feature") edgeType = "depends_on";
      else if (toType === "platform") edgeType = "depends_on";
      else if (fromType === "domain" && toType !== "domain" && toType !== "shared") edgeType = "violates";

      addEdge(sourceId, targetId, edgeType, relPath, imp);
    }
  }

  /* ── 7. Validate architecture rules ── */

  function addViolation(from, to, severity, rule, description, file) {
    violations.push({
      from,
      to,
      type: "violates",
      severity,
      rule,
      description,
      file: file || null,
    });
  }

  for (const edge of edges) {
    const fromType = extractNodeType(edge.from);
    const toType = extractNodeType(edge.to);

    /* R1: feature → infra = CRITICAL */
    if (fromType === "feature" && toType === "infra") {
      addViolation(edge.from, edge.to, SEVERITY.CRITICAL, "R1",
        "Features no acceden infraestructura directamente (deben usar adapter)", edge.file);
      edge.type = "violates";
    }

    /* R2: platform → feature = CRITICAL */
    if (fromType === "platform" && toType === "feature") {
      addViolation(edge.from, edge.to, SEVERITY.CRITICAL, "R2",
        "Platform no debe depender de features (el backbone es independiente del negocio)", edge.file);
      edge.type = "violates";
    }

    /* R3: shared → feature = ERROR */
    if (fromType === "shared" && toType === "feature") {
      addViolation(edge.from, edge.to, SEVERITY.ERROR, "R3",
        "Shared no debe importar de features (shared debe ser puro)", edge.file);
      edge.type = "violates";
    }

    /* R4: shared → infra = ERROR */
    if (fromType === "shared" && toType === "infra") {
      addViolation(edge.from, edge.to, SEVERITY.ERROR, "R4",
        "Shared no debe importar infraestructura (shared debe ser agnóstico)", edge.file);
      edge.type = "violates";
    }

    /* R5: domain → infra = CRITICAL */
    if (fromType === "domain" && toType === "infra") {
      addViolation(edge.from, edge.to, SEVERITY.CRITICAL, "R5",
        "Domain no puede importar infraestructura directamente", edge.file);
      edge.type = "violates";
    }

    /* R6: domain → platform = CRITICAL */
    if (fromType === "domain" && toType === "platform") {
      addViolation(edge.from, edge.to, SEVERITY.CRITICAL, "R6",
        "Domain no puede importar platform directamente (debe ser puro)", edge.file);
      edge.type = "violates";
    }

    /* R7: infra → feature = WARNING */
    if (fromType === "infra" && toType === "feature") {
      addViolation(edge.from, edge.to, SEVERITY.WARNING, "R7",
        "Infraestructura no debería importar features directamente", edge.file);
      edge.type = "violates";
    }

    /* R8: Cross-feature direct imports */
    const fromFeatMatch = edge.from.match(/^(?:feature|domain|adapter):(.+)$/);
    const toFeatMatch = edge.to.match(/^(?:feature|domain|adapter):(.+)$/);
    if (fromFeatMatch && toFeatMatch && fromFeatMatch[1] !== toFeatMatch[1]) {
      addViolation(edge.from, edge.to, SEVERITY.ERROR, "R8",
        "Features no deben importar código de otro feature directamente (usar interfaces inyectadas)", edge.file);
      edge.type = "violates";
    }
  }

  /* R9: Cycle detection across all layers */
  const allEdges = edges.filter(e => e.type !== "violates");
  const directedEdges = {};
  const allNodeIds = [...new Set(allEdges.flatMap(e => [e.from, e.to]))];
  for (const nid of allNodeIds) directedEdges[nid] = [];
  for (const e of allEdges) {
    if (directedEdges[e.from]) directedEdges[e.from].push(e.to);
  }

  let hasCycles = false;
  function dfs(node, visited, stack) {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    stack.add(node);
    for (const nb of directedEdges[node] || []) {
      if (dfs(nb, visited, stack)) return true;
    }
    stack.delete(node);
    return false;
  }

  const visited = new Set();
  for (const n of allNodeIds) {
    if (hasCycles) break;
    if (!visited.has(n)) {
      if (dfs(n, visited, new Set())) {
        hasCycles = true;
      }
    }
  }

  if (hasCycles) {
    addViolation("(cycle)", "(cycle)", SEVERITY.ERROR, "R9",
      "Ciclo de dependencia detectado en el grafo global");
  }

  /* ── 7a. Summary output (compact) ── */
function buildSummary(graph) {
  return {
    stats: graph.stats,
    violations: graph.violations.map(v => ({ rule: v.rule, severity: v.severity, from: v.from, to: v.to, description: v.description })),
  };
}

/* ── 8. Stats ── */
  const bySeverity = { CRITICAL: 0, ERROR: 0, WARNING: 0 };
  for (const v of violations) {
    bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1;
  }

  const riskScore = Math.min(100,
    (bySeverity.CRITICAL || 0) * 30 +
    (bySeverity.ERROR || 0) * 10 +
    (bySeverity.WARNING || 0) * 3
  );

  const health = riskScore === 0 ? "healthy"
    : riskScore <= 30 ? "degraded"
    : "critical";

  /* Layer counts */
  const layerStats = { platform: 0, feature: 0, shared: 0, infra: 0, domain: 0, adapter: 0 };
  for (const n of nodes) {
    if (layerStats[n.type] !== undefined) layerStats[n.type]++;
  }

  /* Dependency health: ratio of valid vs total edges */
  const validEdges = edges.filter(e => e.type !== "violates").length;
  const dependencyHealth = edges.length > 0
    ? Math.round((validEdges / edges.length) * 100)
    : 100;

  return {
    nodes,
    edges,
    violations,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      violations: violations.length,
      criticalViolations: bySeverity.CRITICAL || 0,
      errorViolations: bySeverity.ERROR || 0,
      warningViolations: bySeverity.WARNING || 0,
      hasCycles,
      riskScore,
      health,
      dependencyHealth,
      layers: layerStats,
    },
  };
}

export function validateGraph(graph) {
  return {
    violations: graph.violations,
    stats: graph.stats,
    score: Math.max(0, 100 - graph.stats.riskScore),
  };
}

/**
 * getGraph — Cache-aware graph builder.
 * Uses cached graph if src/ hasn't changed, builds fresh otherwise.
 * Call with { force: true } to always rebuild.
 */
let _graphCache = null;

export function getGraph(projectRoot = ROOT, opts = {}) {
  const { force = false } = opts;

  // Return memoized in-memory graph (same process)
  if (_graphCache && !force) return _graphCache;

  // Try disk cache
  if (!force) {
    const cached = loadCache("graph", projectRoot);
    if (cached.valid && cached.data) {
      _graphCache = cached.data;
      return _graphCache;
    }
  }

  // Build fresh and cache
  const graph = buildGraph(projectRoot);
  saveCache("graph", graph, projectRoot);
  _graphCache = graph;
  return graph;
}

/**
 * Reset in-memory cache (for testing or forced refresh).
 */
export function resetGraphCache() {
  _graphCache = null;
}

export function exportGraph(graph) {
  let out = "## Architecture Graph\n\n";
  out += `**Nodes:** ${graph.stats.totalNodes}  \n`;
  out += `**Edges:** ${graph.stats.totalEdges}  \n`;
  out += `**Risk Score:** ${graph.stats.riskScore}/100  \n`;
  out += `**Health:** ${graph.stats.health}  \n`;
  out += `**Dependency Health:** ${graph.stats.dependencyHealth}%  \n\n`;

  const typeLabels = {
    platform: "Platform Layer",
    feature: "Feature Layer",
    shared: "Shared Layer",
    infra: "Infrastructure Layer",
    domain: "Domain Layer",
    adapter: "Adapter Layer",
  };

  const typeOrder = ["platform", "feature", "shared", "infra", "domain", "adapter"];

  for (const type of typeOrder) {
    const typeNodes = graph.nodes.filter(n => n.type === type);
    if (typeNodes.length === 0) continue;
    out += `### ${typeLabels[type]}\n`;
    for (const n of typeNodes) {
      out += `- \`${n.id}\` — ${n.label}\n`;
    }
    out += "\n";
  }

  if (graph.violations.length > 0) {
    out += "### Violations\n";
    out += "| Rule | From | To | Severity | Description |\n";
    out += "|------|------|----|----------|-------------|\n";
    for (const v of graph.violations) {
      out += `| ${v.rule} | \`${v.from}\` | \`${v.to}\` | ${v.severity} | ${v.description} |\n`;
    }
    out += "\n";
  }

  out += "### Dependency Graph\n";
  const layerEdges = graph.edges.filter(e =>
    ["platform", "feature", "shared", "infra"].includes(extractNodeType(e.from)) ||
    ["platform", "feature", "shared", "infra"].includes(extractNodeType(e.to))
  );
  const edgeGroup = {};
  for (const e of layerEdges) {
    if (!edgeGroup[e.from]) edgeGroup[e.from] = [];
    const suffix = e.type === "violates" ? " (VIOLATION)" : "";
    edgeGroup[e.from].push(`${e.to}${suffix}`);
  }
  for (const [from, targets] of Object.entries(edgeGroup)) {
    out += `- \`${from}\` → [${targets.join(", ")}]\n`;
  }
  out += "\n";

  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const format = args.includes("--json") ? "json" : "text";
  const summary = args.includes("--summary");
  const force = args.includes("--force");
  const graph = getGraph(ROOT, { force });
  if (format === "json") {
    if (summary) {
      console.log(JSON.stringify(buildSummary(graph), null, 2));
    } else {
      console.log(JSON.stringify(graph, null, 2));
    }
  } else {
    if (summary) {
      console.log(`Graph: ${graph.stats.totalNodes} nodes, ${graph.stats.totalEdges} edges, ${graph.stats.violations} violations, risk ${graph.stats.riskScore}/100, health: ${graph.stats.health}`);
    } else {
      console.log(exportGraph(graph));
    }
  }
}

if (process.argv[1] && (process.argv[1].endsWith("graph.mjs") || process.argv[1].endsWith("graph.js"))) {
  main().catch(console.error);
}
