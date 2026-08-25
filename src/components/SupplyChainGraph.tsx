"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { layoutHint } from "@/lib/graph";
import type { GraphNode, NodeLabel, SupplyChainGraph } from "@/lib/types";

type TraceNodeData = {
  id: string;
  label: NodeLabel;
  title: string;
  subtitle?: string;
  data: Record<string, unknown>;
  selected?: boolean;
  [key: string]: unknown;
};

const labelColors: Record<NodeLabel, string> = {
  QualityEvent: "#e11d48",
  MaterialBatch: "#ff6a00",
  ProductionBatch: "#2563eb",
  Product: "#0a0a0a",
  Shipment: "#6b7280",
  Order: "#78716c",
  Customer: "#44403c",
  Material: "#ea580c",
  Supplier: "#c2410c",
};

function TraceNode({ data }: NodeProps<Node<TraceNodeData>>) {
  const color = labelColors[data.label] ?? "#0a0a0a";

  return (
    <div
      className="min-w-[140px] max-w-[180px] rounded-2xl border bg-surface px-3 py-2.5 shadow-sm"
      style={{
        borderColor: data.selected ? color : "var(--border)",
        boxShadow: data.selected ? `0 0 0 3px ${color}22` : undefined,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-border !w-2 !h-2" />
      <p className="font-mono text-[10px] tracking-wider uppercase" style={{ color }}>
        {data.label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold text-ink">{data.title}</p>
      {data.subtitle ? (
        <p className="truncate text-xs text-muted">{data.subtitle}</p>
      ) : null}
      <Handle type="source" position={Position.Bottom} className="!bg-border !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { trace: TraceNode };

function buildLayout(graph: SupplyChainGraph): {
  nodes: Node<TraceNodeData>[];
  edges: Edge[];
} {
  const columns = new Map<number, GraphNode[]>();
  for (const node of graph.nodes) {
    const col = layoutHint(node.label);
    const list = columns.get(col) ?? [];
    list.push(node);
    columns.set(col, list);
  }

  const nodes: Node<TraceNodeData>[] = [];
  const sortedCols = Array.from(columns.keys()).sort((a, b) => a - b);

  sortedCols.forEach((col, colIndex) => {
    const items = columns.get(col) ?? [];
    items.forEach((item, rowIndex) => {
      nodes.push({
        id: item.id,
        type: "trace",
        position: {
          x: colIndex * 220,
          y: rowIndex * 110,
        },
        data: {
          id: item.id,
          label: item.label,
          title: item.title,
          subtitle: item.subtitle,
          data: item.data,
        },
      });
    });
  });

  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.type,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    style: { stroke: "#c4c9d1", strokeWidth: 1.5 },
    labelStyle: {
      fill: "#6b7280",
      fontSize: 10,
      fontFamily: "IBM Plex Mono, monospace",
    },
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.92 },
  }));

  return { nodes, edges };
}

export function SupplyChainGraphView({
  graph,
  selectedId,
  onSelect,
}: {
  graph: SupplyChainGraph;
  selectedId?: string | null;
  onSelect?: (nodeId: string) => void;
}) {
  const { nodes, edges } = useMemo(() => buildLayout(graph), [graph]);

  const decoratedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selected: node.id === selectedId,
        },
      })),
    [nodes, selectedId],
  );

  return (
    <div className="dashboard-card h-full min-h-[420px] w-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
            Supply chain graph
          </p>
          <p className="text-sm font-medium text-ink">Impact path visualization</p>
        </div>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-accent/60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
        </span>
      </div>
      <div className="h-[calc(100%-57px)] min-h-[360px]">
        <ReactFlow
          nodes={decoratedNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.35}
          maxZoom={1.4}
          onNodeClick={(_, node) => onSelect?.(node.id)}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={22} color="#e8eaee" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
