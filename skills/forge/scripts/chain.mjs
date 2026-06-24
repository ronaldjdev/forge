#!/usr/bin/env node

import { buildGraph } from "./graph.mjs";

export function buildDependencyGraph(projectRoot) {
  const graph = buildGraph(projectRoot);

  const layers = {
    platform: [],
    features: [],
    shared: [],
    infra: [],
  };

  for (const n of graph.nodes) {
    if (n.type === "platform") layers.platform.push(n);
    else if (n.type === "feature") layers.features.push(n);
    else if (n.type === "shared") layers.shared.push(n);
    else if (n.type === "infra") layers.infra.push(n);
  }

  /* Layer-specific edges (excluding violations) */
  function layerEdges(type) {
    return graph.edges.filter(e =>
      e.type !== "violates" &&
      e.from.startsWith(`${type}:`) &&
      e.to.startsWith(`${type}:`)
    );
  }

  const platformEdges = layerEdges("platform");
  const featureEdges = layerEdges("feature");
  const sharedEdges = layerEdges("shared");
  const infraEdges = layerEdges("infra");

  /* Topological sort helper */
  function topoSort(nodes, edges) {
    const adj = {};
    const inDegree = {};
    const ids = nodes.map(n => n.id);
    for (const id of ids) {
      adj[id] = [];
      inDegree[id] = 0;
    }
    for (const e of edges) {
      if (adj[e.from]) {
        adj[e.from].push(e.to);
        inDegree[e.to] = (inDegree[e.to] || 0) + 1;
      }
    }
    const queue = ids.filter(id => inDegree[id] === 0);
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
      order,
      hasCycles: order.length < ids.length,
      cycleFree: order.length === ids.length,
    };
  }

  const featTopo = topoSort(layers.features, featureEdges);
  const platTopo = layers.platform.length > 0
    ? topoSort(layers.platform, platformEdges)
    : { order: [], hasCycles: false, cycleFree: true };
  const sharedTopo = layers.shared.length > 0
    ? topoSort(layers.shared, sharedEdges)
    : { order: [], hasCycles: false, cycleFree: true };
  const infraTopo = layers.infra.length > 0
    ? topoSort(layers.infra, infraEdges)
    : { order: [], hasCycles: false, cycleFree: true };

  /* Global cycle detection across all layers */
  const globalEdges = graph.edges.filter(e => e.type !== "violates");
  const globalAdj = {};
  const allIds = [...new Set(globalEdges.flatMap(e => [e.from, e.to]))];
  for (const id of allIds) globalAdj[id] = [];
  for (const e of globalEdges) {
    if (globalAdj[e.from]) globalAdj[e.from].push(e.to);
  }

  let hasGlobalCycle = false;
  function dfs(node, visited, stack) {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    stack.add(node);
    for (const nb of globalAdj[node] || []) {
      if (dfs(nb, visited, stack)) return true;
    }
    stack.delete(node);
    return false;
  }
  const gVisited = new Set();
  for (const n of allIds) {
    if (hasGlobalCycle) break;
    if (!gVisited.has(n)) {
      if (dfs(n, gVisited, new Set())) hasGlobalCycle = true;
    }
  }

  /* Illegal chains (transitive violations) */
  const illegalChains = [];
  const allowedDirections = {
    feature: ["platform", "shared", "domain"],
    platform: ["infra", "shared"],
    shared: [],
    infra: [],
    domain: ["shared"],
    adapter: ["domain", "infra", "platform", "shared"],
  };

  for (const e of graph.edges) {
    if (e.type === "violates") continue;
    const fromType = e.from.split(":")[0];
    const toType = e.to.split(":")[0];
    if (!allowedDirections[fromType]) continue;
    if (!allowedDirections[fromType].includes(toType)) {
      illegalChains.push({
        from: e.from,
        to: e.to,
        type: e.type,
        file: e.file,
        reason: `${fromType} → ${toType} no es una dirección permitida`,
      });
    }
  }

  /* Isolated components (no edges at all) */
  const connected = new Set();
  for (const e of graph.edges) {
    connected.add(e.from);
    connected.add(e.to);
  }
  const isolated = graph.nodes.filter(n => !connected.has(n.id));

  /* Format feature edges as simple source/target (backward compat) */
  const simpleFeatEdges = featureEdges.map(e => ({
    source: e.from.replace("feature:", ""),
    target: e.to.replace("feature:", ""),
    file: e.file,
  }));

  const allFeatIds = [...new Set([
    ...simpleFeatEdges.map(e => e.source),
    ...simpleFeatEdges.map(e => e.target),
    ...layers.features.map(n => n.id.replace("feature:", "")),
  ])];

  return {
    nodes: allFeatIds.map(id => ({ id, type: "feature" })),
    edges: simpleFeatEdges,
    features: allFeatIds,
    topologicalOrder: featTopo.order,
    hasCycles: featTopo.hasCycles,
    cycleFree: featTopo.cycleFree,
    layers: {
      platform: {
        nodes: layers.platform.map(n => n.id),
        edges: platformEdges,
        order: platTopo.order,
        hasCycles: platTopo.hasCycles,
      },
      features: {
        nodes: allFeatIds,
        edges: simpleFeatEdges,
        order: featTopo.order,
        hasCycles: featTopo.hasCycles,
      },
      shared: {
        nodes: layers.shared.map(n => n.id),
        edges: sharedEdges,
        order: sharedTopo.order,
        hasCycles: sharedTopo.hasCycles,
      },
      infra: {
        nodes: layers.infra.map(n => n.id),
        edges: infraEdges,
        order: infraTopo.order,
        hasCycles: infraTopo.hasCycles,
      },
    },
    globalCycles: hasGlobalCycle,
    illegalChains,
    isolated: isolated.map(n => n.id),
    graph,
  };
}

async function main() {
  const depGraph = buildDependencyGraph();
  const args = process.argv.slice(2);
  if (args.includes("--json")) {
    console.log(JSON.stringify(depGraph, null, 2));
  } else {
    console.log("## Chain — Multi-layer Dependency Analysis\n");
    console.log(`### Features (${depGraph.features.length})`);
    console.log(`  Order: ${depGraph.topologicalOrder.join(" → ") || "(none)"}`);
    console.log(`  Cycles: ${depGraph.hasCycles ? "YES ⚠" : "None ✓"}`);
    console.log();

    console.log(`### Platform (${depGraph.layers.platform.nodes.length})`);
    if (depGraph.layers.platform.nodes.length > 0) {
      console.log(`  Order: ${depGraph.layers.platform.order.join(" → ") || "(independent)"}`);
      console.log(`  Cycles: ${depGraph.layers.platform.hasCycles ? "YES ⚠" : "None ✓"}`);
    } else {
      console.log("  (none detected)");
    }
    console.log();

    console.log(`### Shared (${depGraph.layers.shared.nodes.length})`);
    if (depGraph.layers.shared.nodes.length > 0) {
      console.log(`  Cycles: ${depGraph.layers.shared.hasCycles ? "YES ⚠" : "None ✓"}`);
    } else {
      console.log("  (none detected)");
    }
    console.log();

    console.log(`### Infra (${depGraph.layers.infra.nodes.length})`);
    if (depGraph.layers.infra.nodes.length > 0) {
      console.log(`  Cycles: ${depGraph.layers.infra.hasCycles ? "YES ⚠" : "None ✓"}`);
    } else {
      console.log("  (none detected)");
    }
    console.log();

    console.log(`### Global Cycles: ${depGraph.globalCycles ? "YES ⚠" : "None ✓"}`);
    console.log();

    if (depGraph.illegalChains.length > 0) {
      console.log("### Illegal Chains");
      for (const c of depGraph.illegalChains) {
        console.log(`  ⚠ ${c.from} → ${c.to} (${c.reason})${c.file ? ` — ${c.file}` : ""}`);
      }
      console.log();
    }

    if (depGraph.isolated.length > 0) {
      console.log("### Isolated Components");
      for (const id of depGraph.isolated) {
        console.log(`  ○ ${id}`);
      }
      console.log();
    }
  }
}

if (process.argv[1] && (process.argv[1].endsWith("chain.mjs") || process.argv[1].endsWith("chain.js"))) {
  main().catch(console.error);
}


