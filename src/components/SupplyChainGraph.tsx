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
  QualityEvent: "#be123c",
  MaterialBatch: "#0f766e",
  ProductionBatch: "#1d4ed8",
  Product: "#0b1520",
  Shipment: "#4d5d6d",
  Order: "#64748b",
  Customer: "#334155",
  Material: "#0f766e",
  Supplier: "#115e59",
};

function TraceNode({ data }: NodeProps<Node<TraceNodeData>>) {
  const color = labelColors[data.label] ?? "#0b1520";

  return (
    <div
      className="min-w-[140px] max-w-[180px] border bg-surface px-3 py-2 shadow-sm"
      style={{
        borderColor: data.selected ? color : "var(--border)",
        boxShadow: data.selected ? `0 0 0 2px ${color}33` : undefined,
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
    style: { stroke: "#94a3b8", strokeWidth: 1.5 },
    labelStyle: {
      fill: "#64748b",
      fontSize: 10,
      fontFamily: "IBM Plex Mono, monospace",
    },
    labelBgStyle: { fill: "#f7fafc", fillOpacity: 0.9 },
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
    <div className="h-[480px] w-full overflow-hidden border border-border bg-surface">
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
        <Background gap={20} color="#c5d0db" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
