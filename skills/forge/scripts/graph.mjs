#!/usr/bin/env node

import { join, relative, dirname } from "path";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const FEATURES_DIR = join(SRC, "features");

const IMPORT_RE = /import\s+(?:type\s+)?(?:\{[^}]*\}|[^;{]+)\s+from\s+['"]([^'"]+)['"]/g;

const INFRA_PACKAGES = {
  "prisma": "infra:prisma",
  "@prisma/client": "infra:prisma",
  "mongoose": "infra:mongoose",
  "pg": "infra:pg",
  "mysql2": "infra:mysql",
  "redis": "infra:redis",
  "amqplib": "infra:rabbitmq",
  "kafka": "infra:kafka",
  "@nestjs/core": "infra:nestjs",
  "express": "infra:express",
  "fastify": "infra:fastify",
  "typeorm": "infra:typeorm",
  "drizzle-orm": "infra:drizzle",
  "aws-sdk": "infra:aws",
  "@aws-sdk/client-s3": "infra:aws",
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

function parseImports(content) {
  const imports = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(IMPORT_RE);
    if (m) {
      for (const full of m) {
        const src = full.match(/from\s+['"]([^'"]+)['"]/);
        if (src) imports.push(src[1]);
      }
    }
  }
  return imports;
}

function classifyPath(relPath) {
  const parts = relPath.split("/");
  if (parts.includes("domain")) return "domain";
  if (parts.includes("adapters")) return "adapter";
  if (parts.includes("features")) {
    if (parts.includes("application")) return "application";
    return "feature";
  }
  if (parts.includes("core")) return "core";
  if (parts.includes("shared")) return "core";
  if (parts.includes("lib")) return "core";
  if (parts.includes("infrastructure")) return "infra";
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

  for (const [pkg, id] of Object.entries(INFRA_PACKAGES)) {
    if (importPath === pkg || importPath.startsWith(pkg + "/")) return id;
  }

  if (importPath.includes("/infrastructure/")) return "infra:infrastructure";

  if (importPath.includes("/core/") || importPath.startsWith("@/core") || importPath.startsWith("../core")) return "core:shared";
  if (importPath.includes("/shared/") || importPath.startsWith("@/shared")) return "core:shared";
  if (importPath.includes("/lib/")) return "core:shared";

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

  /* ── 1. Feature nodes ── */
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

  /* ── 2. Core nodes ── */
  for (const dir of ["core", "shared", "lib"]) {
    const fullPath = join(src, dir);
    if (isDir(fullPath)) {
      addNode(`core:${dir}`, "core", dir, `src/${dir}/`);
    }
  }

  /* ── 3. Infra directory node ── */
  const infraPath = join(src, "infrastructure");
  if (isDir(infraPath)) {
    addNode("infra:infrastructure", "infra", "infrastructure", "src/infrastructure/");
  }

  /* ── 4. Global adapters node ── */
  const globalAdapters = join(src, "adapters");
  if (isDir(globalAdapters)) {
    addNode("adapter:global", "adapter", "adapters (global)", "src/adapters/");
  }

  /* ── 5. Scan files and build edges ── */
  const allFiles = findFiles(src, [".ts", ".js", ".tsx", ".jsx"], 8);
  const fileContents = allFiles.map(f => ({ file: f, content: read(f) })).filter(x => x.content);

  /* 5a. Detect used infra packages first */
  const usedPackages = new Set();
  for (const { content } of fileContents) {
    const imports = parseImports(content);
    for (const imp of imports) {
      for (const [pkg, id] of Object.entries(INFRA_PACKAGES)) {
        if (imp === pkg || imp.startsWith(pkg + "/")) usedPackages.add(id);
      }
    }
  }
  for (const pkgId of usedPackages) {
    const label = pkgId.replace("infra:", "");
    addNode(pkgId, "infra", label, `(package) ${label}`);
  }

  /* 5b. Parse imports and create edges */
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
      else sourceId = `feature:${featName}`;
    } else if (sourceType === "core") {
      sourceId = "core:shared";
    } else if (sourceType === "infra") {
      sourceId = "infra:infrastructure";
    } else if (sourceType === "adapter") {
      sourceId = "adapter:global";
    }

    if (!sourceId || !idSet.has(sourceId)) continue;

    const imports = parseImports(content);
    const seenTargets = new Set();

    for (const imp of imports) {
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
      else if (fromType === "domain" && toType !== "domain" && toType !== "core") edgeType = "violates";

      addEdge(sourceId, targetId, edgeType, relPath, imp);
    }
  }

  /* ── 6. Validate architecture rules ── */

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

    if (fromType === "core" && toType === "feature") {
      addViolation(edge.from, edge.to, SEVERITY.CRITICAL, "R1",
        "Core nunca debe depender de features", edge.file);
      edge.type = "violates";
    }

    if (fromType === "domain" && toType === "infra") {
      addViolation(edge.from, edge.to, SEVERITY.CRITICAL, "R2",
        "Domain no puede importar infraestructura directamente", edge.file);
      edge.type = "violates";
    }

    if (fromType === "feature" && toType === "infra") {
      addViolation(edge.from, edge.to, SEVERITY.CRITICAL, "R3",
        "Features no acceden infraestructura directamente (deben usar adapter)", edge.file);
      edge.type = "violates";
    }

    const fromFeatMatch = edge.from.match(/^(?:feature|domain|adapter):(.+)$/);
    const toFeatMatch = edge.to.match(/^(?:feature|domain|adapter):(.+)$/);
    if (fromFeatMatch && toFeatMatch && fromFeatMatch[1] !== toFeatMatch[1]) {
      addViolation(edge.from, edge.to, SEVERITY.ERROR, "R4",
        "Features no deben importar código de otro feature directamente (usar interfaces inyectadas)", edge.file);
      edge.type = "violates";
    }

    if (fromType === "infra" && (toType === "domain" || toType === "feature")) {
      addViolation(edge.from, edge.to, SEVERITY.WARNING, "R6",
        "Infraestructura no debería importar dominio interno del feature", edge.file);
      edge.type = "violates";
    }
  }

  /* R5: Cycle detection between features */
  const featEdges = edges.filter(e =>
    e.from.startsWith("feature:") && e.to.startsWith("feature:")
  );
  if (featEdges.length > 0) {
    const featAdj = {};
    const allFeatIds = [...new Set(featEdges.flatMap(e => [e.from, e.to]))];
    for (const fid of allFeatIds) featAdj[fid] = [];
    for (const e of featEdges) featAdj[e.from].push(e.to);

    let hasCycle = false;
    function dfs(node, visited, stack) {
      if (stack.has(node)) return true;
      if (visited.has(node)) return false;
      visited.add(node);
      stack.add(node);
      for (const nb of featAdj[node] || []) {
        if (dfs(nb, visited, stack)) return true;
      }
      stack.delete(node);
      return false;
    }

    const visited = new Set();
    for (const n of allFeatIds) {
      if (hasCycle) break;
      if (!visited.has(n)) {
        if (dfs(n, visited, new Set())) {
          hasCycle = true;
        }
      }
    }

    if (hasCycle) {
      addViolation("(cycle)", "(cycle)", SEVERITY.ERROR, "R5",
        "Ciclo de dependencia detectado entre features");
    }
  }

  /* ── 7. Stats ── */
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
      riskScore,
      health,
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

export function exportGraph(graph) {
  let out = "## Architecture Graph\n\n";
  out += `**Nodes:** ${graph.stats.totalNodes}  \n`;
  out += `**Edges:** ${graph.stats.totalEdges}  \n`;
  out += `**Risk Score:** ${graph.stats.riskScore}/100  \n`;
  out += `**Health:** ${graph.stats.health}  \n\n`;

  const byType = {};
  for (const n of graph.nodes) {
    if (!byType[n.type]) byType[n.type] = [];
    byType[n.type].push(n);
  }

  for (const [type, typeNodes] of Object.entries(byType)) {
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    out += `### ${label} Layer\n`;
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
  const featureEdges = graph.edges.filter(e =>
    e.from.startsWith("feature:") || e.to.startsWith("feature:")
  );
  const featGroup = {};
  for (const e of featureEdges) {
    if (!featGroup[e.from]) featGroup[e.from] = [];
    const suffix = e.type === "violates" ? " (VIOLATION)" : "";
    featGroup[e.from].push(`${e.to}${suffix}`);
  }
  for (const [from, targets] of Object.entries(featGroup)) {
    out += `- \`${from}\` → [${targets.join(", ")}]\n`;
  }
  out += "\n";

  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const format = args.includes("--json") ? "json" : "text";
  const graph = buildGraph();
  if (format === "json") {
    console.log(JSON.stringify(graph, null, 2));
  } else {
    console.log(exportGraph(graph));
  }
}

if (process.argv[1] && (process.argv[1].endsWith("graph.mjs") || process.argv[1].endsWith("graph.js"))) {
  main().catch(console.error);
}
