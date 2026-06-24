#!/usr/bin/env node

import { join, relative } from "path";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const FEATURES = join(SRC, "features");

const IMPORT_RE = /import\s+(?:type\s+)?(?:\{[^}]*\}|[^;{]+)\s+from\s+['"]([^'"]+)['"]/g;

function read(path) {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

function exists(path) {
  return existsSync(path);
}

function isDir(path) {
  return existsSync(path) && statSync(path).isDirectory();
}

function listDir(path) {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
}

function findFiles(dir, ext, maxDepth = 5) {
  const results = [];
  function walk(d, depth) {
    if (depth > maxDepth) return;
    try {
      for (const entry of readdirSync(d)) {
        const full = join(d, entry);
        if (statSync(full).isDirectory()) {
          walk(full, depth + 1);
        } else if (entry.endsWith(ext)) {
          results.push(full);
        }
      }
    } catch { /* skip */ }
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

export function buildDependencyGraph(projectRoot = ROOT) {
  const src = join(projectRoot, "src");
  const featuresDir = join(src, "features");

  if (!isDir(featuresDir)) {
    return { nodes: [], edges: [], features: [] };
  }

  const features = listDir(featuresDir).filter((f) => isDir(join(featuresDir, f)));
  const nodes = features.map((name) => ({ id: name, type: "feature" }));
  const edges = [];
  const allFiles = findFiles(featuresDir, ".ts", 6);

  for (const f of allFiles) {
    const content = read(f);
    if (!content) continue;
    const sourceFeature = features.find((feat) => f.includes(join(featuresDir, feat)));
    if (!sourceFeature) continue;

    const imports = parseImports(content);
    for (const imp of imports) {
      for (const targetFeature of features) {
        if (targetFeature === sourceFeature) continue;
        if (
          imp.includes(`features/${targetFeature}/`) ||
          imp.includes(`${targetFeature}/domain/`) ||
          imp.includes(`${targetFeature}/application/`)
        ) {
          edges.push({
            source: sourceFeature,
            target: targetFeature,
            file: relative(projectRoot, f),
          });
        }
      }
    }
  }

  return { nodes, edges, features };
}

function detectOrder(graph) {
  const adj = {};
  const inDegree = {};

  for (const node of graph.nodes) {
    adj[node.id] = [];
    inDegree[node.id] = 0;
  }
  for (const edge of graph.edges) {
    if (adj[edge.source]) {
      adj[edge.source].push(edge.target);
      inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
    }
  }

  const queue = graph.nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
  const order = [];

  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node);
    for (const neighbor of adj[node] || []) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }

  return order;
}

async function main() {
  const graph = buildDependencyGraph();
  const topological = detectOrder(graph);

  const result = {
    ...graph,
    topologicalOrder: topological,
    hasCycles: topological.length < graph.nodes.length,
    cycleFree: topological.length === graph.nodes.length,
  };

  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && (process.argv[1].endsWith("dependencies.mjs") || process.argv[1].endsWith("dependencies.js"))) {
  main().catch(console.error);
}
