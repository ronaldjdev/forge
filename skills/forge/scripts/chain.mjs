#!/usr/bin/env node

import { buildGraph } from "./graph.mjs";

export function buildDependencyGraph(projectRoot) {
  const graph = buildGraph(projectRoot);

  const featEdges = graph.edges.filter(e =>
    e.from.startsWith("feature:") && e.to.startsWith("feature:") && e.type !== "violates"
  );

  const allFeatIds = [...new Set([
    ...featEdges.map(e => e.from.replace("feature:", "")),
    ...featEdges.map(e => e.to.replace("feature:", "")),
    ...graph.nodes.filter(n => n.type === "feature").map(n => n.id.replace("feature:", "")),
  ])];

  const edges = featEdges.map(e => ({
    source: e.from.replace("feature:", ""),
    target: e.to.replace("feature:", ""),
    file: e.file,
  }));

  const nodes = allFeatIds.map(id => ({ id, type: "feature" }));

  /* Topological sort (Kahn's algorithm) */
  const adj = {};
  const inDegree = {};
  for (const n of nodes) {
    adj[n.id] = [];
    inDegree[n.id] = 0;
  }
  for (const e of edges) {
    if (adj[e.source]) {
      adj[e.source].push(e.target);
      inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    }
  }

  const queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
  const order = [];
  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node);
    for (const nb of adj[node] || []) {
      inDegree[nb]--;
      if (inDegree[nb] === 0) queue.push(nb);
    }
  }

  return {
    nodes,
    edges,
    features: allFeatIds,
    topologicalOrder: order,
    hasCycles: order.length < nodes.length,
    cycleFree: order.length === nodes.length,
  };
}

async function main() {
  const graph = buildDependencyGraph();
  console.log(JSON.stringify(graph, null, 2));
}

if (process.argv[1] && (process.argv[1].endsWith("chain.mjs") || process.argv[1].endsWith("chain.js"))) {
  main().catch(console.error);
}
