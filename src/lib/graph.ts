import type { GraphEdge, GraphNode, NodeLabel, SupplyChainGraph } from "@/lib/types";

const LABEL_PRIORITY: NodeLabel[] = [
  "QualityEvent",
  "Supplier",
  "Material",
  "MaterialBatch",
  "ProductionBatch",
  "Product",
  "Shipment",
  "Order",
  "Customer",
];

export function pickLabel(labels: string[]): NodeLabel {
  for (const preferred of LABEL_PRIORITY) {
    if (labels.includes(preferred)) return preferred;
  }
  return (labels[0] as NodeLabel) ?? "Product";
}

export function nodeTitle(label: NodeLabel, props: Record<string, unknown>): string {
  switch (label) {
    case "MaterialBatch":
    case "ProductionBatch":
      return String(props.batchNumber ?? props.id ?? "Batch");
    case "Product":
      return String(props.name ?? props.sku ?? props.id);
    case "QualityEvent":
      return String(props.type ?? props.id);
    case "Shipment":
      return String(props.id ?? "Shipment");
    case "Order":
      return String(props.orderNumber ?? props.id);
    default:
      return String(props.name ?? props.id ?? label);
  }
}

export function nodeSubtitle(
  label: NodeLabel,
  props: Record<string, unknown>,
): string | undefined {
  switch (label) {
    case "Product":
      return props.sku ? `SKU ${props.sku}` : undefined;
    case "MaterialBatch":
      return props.status ? String(props.status) : undefined;
    case "QualityEvent":
      return props.severity ? String(props.severity) : undefined;
    case "Customer":
      return props.region ? String(props.region) : undefined;
    case "Shipment":
      return props.status ? String(props.status) : undefined;
    case "Order":
      return props.status ? String(props.status) : undefined;
    case "Supplier":
      return props.location ? String(props.location) : undefined;
    case "Material":
      return props.category ? String(props.category) : undefined;
    case "ProductionBatch":
      return props.facility ? String(props.facility) : undefined;
    default:
      return undefined;
  }
}

type NeoNode = {
  identity?: { toString(): string };
  elementId?: string;
  labels: string[];
  properties: Record<string, unknown>;
};

type NeoRel = {
  identity?: { toString(): string };
  elementId?: string;
  type: string;
  startNodeElementId?: string;
  endNodeElementId?: string;
  start?: { elementId?: string; identity?: { toString(): string } };
  end?: { elementId?: string; identity?: { toString(): string } };
};

type NeoPath = {
  segments?: Array<{
    start: NeoNode;
    relationship: NeoRel;
    end: NeoNode;
  }>;
  start?: NeoNode;
  end?: NeoNode;
};

function nodeKey(node: NeoNode): string {
  const id = node.properties?.id;
  if (typeof id === "string" && id.length > 0) return id;
  return node.elementId ?? node.identity?.toString() ?? crypto.randomUUID();
}

function relKey(rel: NeoRel, source: string, target: string): string {
  return (
    rel.elementId ??
    rel.identity?.toString() ??
    `${source}-${rel.type}-${target}`
  );
}

export function graphFromPaths(
  paths: Array<NeoPath | null | undefined>,
  extras: NeoNode[] = [],
): SupplyChainGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  const addNode = (node: NeoNode) => {
    const label = pickLabel(node.labels ?? []);
    const props = node.properties ?? {};
    const id = nodeKey(node);
    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        label,
        title: nodeTitle(label, props),
        subtitle: nodeSubtitle(label, props),
        data: props,
      });
    }
  };

  for (const extra of extras) {
    if (extra) addNode(extra);
  }

  for (const path of paths) {
    if (!path) continue;
    if (path.start) addNode(path.start);
    if (path.end) addNode(path.end);

    for (const segment of path.segments ?? []) {
      addNode(segment.start);
      addNode(segment.end);
      const source = nodeKey(segment.start);
      const target = nodeKey(segment.end);
      const id = relKey(segment.relationship, source, target);
      if (!edges.has(id)) {
        edges.set(id, {
          id,
          source,
          target,
          type: segment.relationship.type,
        });
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  };
}

/** Merge 1-hop neighbor links into a graph so detail pages always show direct connections. */
export function mergeConnectionsIntoGraph(
  graph: SupplyChainGraph,
  center: { id: string; label: NodeLabel; title: string; subtitle?: string; data: Record<string, unknown> },
  connections: Array<{
    type: string;
    direction: "IN" | "OUT";
    id: string;
    label: NodeLabel;
    title: string;
    subtitle?: string;
  }>,
): SupplyChainGraph {
  const nodes = new Map(graph.nodes.map((n) => [n.id, n]));
  const edges = new Map(graph.edges.map((e) => [e.id, e]));

  if (!nodes.has(center.id)) {
    nodes.set(center.id, {
      id: center.id,
      label: center.label,
      title: center.title,
      subtitle: center.subtitle,
      data: center.data,
    });
  }

  for (const connection of connections) {
    if (!connection.id) continue;
    if (!nodes.has(connection.id)) {
      nodes.set(connection.id, {
        id: connection.id,
        label: connection.label,
        title: connection.title,
        subtitle: connection.subtitle,
        data: {},
      });
    }
    const source = connection.direction === "OUT" ? center.id : connection.id;
    const target = connection.direction === "OUT" ? connection.id : center.id;
    const edgeId = `${source}-${connection.type}-${target}`;
    if (!edges.has(edgeId)) {
      edges.set(edgeId, {
        id: edgeId,
        source,
        target,
        type: connection.type,
      });
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  };
}
