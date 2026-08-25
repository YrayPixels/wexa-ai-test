"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Background,
  Controls,
  Handle,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
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
  MaterialBatch: "#f59e0b",
  ProductionBatch: "#3b82f6",
  Product: "#84cc16",
  Shipment: "#64748b",
  Order: "#a855f7",
  Customer: "#06b6d4",
  Material: "#fb923c",
  Supplier: "#f97316",
};

const LEGEND_ORDER: NodeLabel[] = [
  "QualityEvent",
  "MaterialBatch",
  "ProductionBatch",
  "Product",
  "Shipment",
  "Order",
  "Customer",
  "Material",
  "Supplier",
];

function formatLabel(label: NodeLabel): string {
  return label.replace(/([a-z])([A-Z])/g, "$1 $2").toUpperCase();
}

function hrefForNode(label: NodeLabel, id: string): string | null {
  switch (label) {
    case "Supplier":
      return `/suppliers/${id}`;
    case "Material":
      return `/materials/${id}`;
    case "MaterialBatch":
      return `/batches/${id}`;
    case "ProductionBatch":
      return `/production/${id}`;
    case "Product":
      return `/products/${id}`;
    case "Shipment":
      return `/shipments/${id}`;
    case "Order":
      return `/orders/${id}`;
    case "Customer":
      return `/customers/${id}`;
    case "QualityEvent":
      return `/investigations/${encodeURIComponent(id)}`;
    default:
      return null;
  }
}

function TraceNode({ data }: NodeProps<Node<TraceNodeData>>) {
  const color = labelColors[data.label] ?? "#0a0a0a";
  const selected = Boolean(data.selected);

  return (
    <div
      className="min-w-[132px] max-w-[200px] rounded-[18px] border-2 px-3.5 py-2.5 text-center shadow-sm transition-shadow"
      style={{
        borderColor: color,
        background: selected ? color : "#ffffff",
        boxShadow: selected
          ? `0 8px 20px ${color}33`
          : "0 1px 3px rgba(10, 10, 10, 0.06)",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0"
      />
      <p
        className="truncate text-sm font-semibold leading-snug"
        style={{ color: selected ? "#0a0a0a" : "#111827" }}
        title={data.title}
      >
        {data.title}
      </p>
      <p
        className="mt-0.5 font-mono text-[10px] tracking-[0.12em] uppercase"
        style={{ color: selected ? "#0a0a0a" : color, opacity: selected ? 0.72 : 1 }}
      >
        {formatLabel(data.label)}
      </p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0"
      />
    </div>
  );
}

const nodeTypes = { trace: TraceNode };

function buildAdjacency(graph: SupplyChainGraph) {
  const adj = new Map<string, Set<string>>();
  for (const node of graph.nodes) {
    adj.set(node.id, new Set());
  }
  for (const edge of graph.edges) {
    adj.get(edge.source)?.add(edge.target);
    adj.get(edge.target)?.add(edge.source);
  }
  return adj;
}

function pickFocusId(
  graph: SupplyChainGraph,
  preferredId?: string | null,
): string | null {
  if (preferredId && graph.nodes.some((n) => n.id === preferredId)) {
    return preferredId;
  }
  const preferredLabels: NodeLabel[] = [
    "MaterialBatch",
    "Product",
    "Shipment",
    "Customer",
    "ProductionBatch",
    "Order",
    "Material",
    "Supplier",
    "QualityEvent",
  ];
  for (const label of preferredLabels) {
    const match = graph.nodes.find((n) => n.label === label);
    if (match) return match.id;
  }
  return graph.nodes[0]?.id ?? null;
}

function buildRadialLayout(
  graph: SupplyChainGraph,
  focusId: string | null,
): { nodes: Node<TraceNodeData>[]; edges: Edge[] } {
  const adj = buildAdjacency(graph);
  const focus = focusId ?? graph.nodes[0]?.id ?? null;
  const depth = new Map<string, number>();
  const parent = new Map<string, string | null>();

  if (focus) {
    const queue = [focus];
    depth.set(focus, 0);
    parent.set(focus, null);
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const next of adj.get(current) ?? []) {
        if (depth.has(next)) continue;
        depth.set(next, (depth.get(current) ?? 0) + 1);
        parent.set(next, current);
        queue.push(next);
      }
    }
  }

  for (const node of graph.nodes) {
    if (!depth.has(node.id)) {
      depth.set(node.id, 1);
      parent.set(node.id, focus);
    }
  }

  const byDepth = new Map<number, string[]>();
  for (const [id, d] of depth) {
    const list = byDepth.get(d) ?? [];
    list.push(id);
    byDepth.set(d, list);
  }

  const centerX = 420;
  const centerY = 280;
  const ringGap = 210;
  const positions = new Map<string, { x: number; y: number }>();

  if (focus) {
    positions.set(focus, { x: centerX, y: centerY });
  }

  const maxDepth = Math.max(0, ...Array.from(depth.values()));
  for (let d = 1; d <= maxDepth; d++) {
    const ids = byDepth.get(d) ?? [];
    const radius = d * ringGap;
    const count = ids.length;
    ids.forEach((id, index) => {
      const parentId = parent.get(id);
      const parentPos = parentId ? positions.get(parentId) : undefined;
      let baseAngle = -Math.PI / 2;
      if (parentPos && parentId !== focus) {
        baseAngle = Math.atan2(parentPos.y - centerY, parentPos.x - centerX);
      } else if (count > 1) {
        baseAngle = -Math.PI / 2 + (index / count) * Math.PI * 2;
      }

      const spread =
        count === 1
          ? 0
          : ((index - (count - 1) / 2) / Math.max(count, 1)) *
            Math.min(1.4, 2.2 / count) *
            Math.PI;
      const angle =
        parentId && parentId !== focus
          ? baseAngle + spread
          : -Math.PI / 2 + (index / Math.max(count, 1)) * Math.PI * 2;

      positions.set(id, {
        x: centerX + Math.cos(angle) * radius - 70,
        y: centerY + Math.sin(angle) * radius - 28,
      });
    });
  }

  const nodes: Node<TraceNodeData>[] = graph.nodes.map((item) => {
    const pos = positions.get(item.id) ?? { x: centerX, y: centerY };
    return {
      id: item.id,
      type: "trace",
      position: pos,
      data: {
        id: item.id,
        label: item.label,
        title: item.title,
        subtitle: item.subtitle,
        data: item.data,
      },
      draggable: true,
    };
  });

  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.type.replace(/_/g, " ").toUpperCase(),
    type: "default",
    animated: false,
    style: {
      stroke: "#9ca3af",
      strokeWidth: 1.5,
      strokeDasharray: "5 5",
    },
    labelStyle: {
      fill: "#6b7280",
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.08em",
      fontFamily: "IBM Plex Mono, ui-monospace, monospace",
    },
    labelBgStyle: {
      fill: "#f8fafc",
      fillOpacity: 0.92,
    },
    labelBgPadding: [4, 6] as [number, number],
    labelBgBorderRadius: 4,
  }));

  return { nodes, edges };
}

function GraphCanvas({
  graph,
  selectedId,
  focusId: focusIdProp,
  onSelect,
}: {
  graph: SupplyChainGraph;
  selectedId?: string | null;
  focusId?: string | null;
  onSelect?: (nodeId: string) => void;
}) {
  const router = useRouter();
  const { fitView } = useReactFlow();
  const [hiddenLabels, setHiddenLabels] = useState<Set<NodeLabel>>(
    () => new Set(),
  );

  const presentLabels = useMemo(() => {
    const seen = new Set(graph.nodes.map((n) => n.label));
    return LEGEND_ORDER.filter((label) => seen.has(label));
  }, [graph.nodes]);

  const visibleGraph = useMemo(() => {
    if (hiddenLabels.size === 0) return graph;
    const nodes = graph.nodes.filter((node) => !hiddenLabels.has(node.label));
    const visibleIds = new Set(nodes.map((node) => node.id));
    const edges = graph.edges.filter(
      (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target),
    );
    return { nodes, edges };
  }, [graph, hiddenLabels]);

  const focusId = useMemo(
    () => pickFocusId(visibleGraph, focusIdProp ?? selectedId),
    [visibleGraph, focusIdProp, selectedId],
  );
  const { nodes, edges } = useMemo(
    () => buildRadialLayout(visibleGraph, focusId),
    [visibleGraph, focusId],
  );

  const decoratedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selected: node.id === selectedId || node.id === focusId,
        },
      })),
    [nodes, selectedId, focusId],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.22, duration: 280 });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [focusId, fitView, visibleGraph.nodes.length, visibleGraph.edges.length]);

  const onReset = useCallback(() => {
    setHiddenLabels(new Set());
    void fitView({ padding: 0.22, duration: 320 });
  }, [fitView]);

  const toggleLabel = useCallback((label: NodeLabel) => {
    setHiddenLabels((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      // Keep at least one label visible
      if (next.size >= presentLabels.length) return current;
      return next;
    });
  }, [presentLabels.length]);

  const onOpen = useCallback(
    (node: GraphNode | TraceNodeData) => {
      const href = hrefForNode(node.label, node.id);
      if (href) router.push(href);
    },
    [router],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f7f8fa]">
      <ReactFlow
        nodes={decoratedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        minZoom={0.25}
        maxZoom={1.8}
        nodesConnectable={false}
        nodesDraggable
        edgesFocusable={false}
        panOnScroll
        style={{ width: "100%", height: "100%" }}
        onNodeClick={(_, node) => onSelect?.(node.id)}
        onNodeDoubleClick={(_, node) => onOpen(node.data)}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "default",
        }}
      >
        <Background gap={24} size={1} color="#e5e7eb" />
        <Controls
          showInteractive={false}
          className="!m-4 !overflow-hidden !rounded-xl !border !border-border !bg-white !shadow-sm [&>button]:!border-border [&>button]:!bg-white [&>button]:!fill-ink [&>button]:hover:!bg-surface-muted"
        />
        <Panel position="top-left" className="m-4 max-w-[220px]">
          <div className="rounded-xl border border-border/80 bg-white/95 p-3 shadow-sm backdrop-blur-sm">
            <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
              Legend
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {presentLabels.map((label) => {
                const active = !hiddenLabels.has(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleLabel(label)}
                    aria-pressed={active}
                    title={
                      active
                        ? `Hide ${formatLabel(label)}`
                        : `Show ${formatLabel(label)}`
                    }
                    className="flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-center transition"
                    style={{
                      opacity: active ? 1 : 0.38,
                      background: active
                        ? `${labelColors[label]}18`
                        : "transparent",
                    }}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: labelColors[label] }}
                    />
                    <span className="font-mono text-[8px] leading-tight tracking-[0.06em] text-muted uppercase">
                      {formatLabel(label)}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[9px] leading-snug text-muted">
              Tap a type to hide or show it
            </p>
          </div>
        </Panel>
        <Panel position="top-right" className="m-4">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-[#93c5fd] bg-white px-3.5 py-1.5 font-mono text-[10px] tracking-[0.16em] text-ink uppercase shadow-sm transition hover:border-[#60a5fa] hover:bg-[#eff6ff]"
          >
            Reset graph
          </button>
        </Panel>
        <Panel position="bottom-right" className="m-4">
          <p className="rounded-lg bg-white/80 px-2.5 py-1 font-mono text-[10px] tracking-wide text-muted backdrop-blur-sm">
            Click legend to filter · Click node to focus · Double-click to open
          </p>
        </Panel>
      </ReactFlow>
    </div>
  );
}

function GraphFrame({
  graph,
  selectedId,
  focusId,
  onSelect,
  className,
}: {
  graph: SupplyChainGraph;
  selectedId?: string | null;
  focusId?: string | null;
  onSelect?: (nodeId: string) => void;
  className: string;
}) {
  const graphKey = `${graph.nodes.length}:${graph.edges.length}:${graph.nodes[0]?.id ?? ""}:${graph.nodes.at(-1)?.id ?? ""}`;

  return (
    <div className={className}>
      <ReactFlowProvider>
        <GraphCanvas
          key={graphKey}
          graph={graph}
          selectedId={selectedId}
          focusId={focusId}
          onSelect={onSelect}
        />
      </ReactFlowProvider>
    </div>
  );
}

function GraphExpandModal({
  open,
  onClose,
  graph,
  selectedId,
  focusId,
  onSelect,
  title,
  subtitle,
}: {
  open: boolean;
  onClose: () => void;
  graph: SupplyChainGraph;
  selectedId?: string | null;
  focusId?: string | null;
  onSelect?: (nodeId: string) => void;
  title: string;
  subtitle: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close graph modal"
        className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-[81] flex h-[min(92vh,920px)] w-full max-w-[1280px] flex-col overflow-hidden rounded-[20px] border border-border bg-surface shadow-[0_24px_80px_rgba(10,10,10,0.28)] animate-fade-up"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
              Expanded graph
            </p>
            <h2 className="truncate font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
              {title}
            </h2>
            <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right font-mono text-[10px] tracking-wide text-muted uppercase sm:block">
              <p>{graph.nodes.length} nodes</p>
              <p>{graph.edges.length} links</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-ink transition hover:border-accent hover:text-accent"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <GraphFrame
          graph={graph}
          selectedId={selectedId}
          focusId={focusId}
          onSelect={onSelect}
          className="min-h-0 flex-1"
        />
      </div>
    </div>,
    document.body,
  );
}

export function SupplyChainGraphView({
  graph,
  selectedId,
  focusId,
  onSelect,
  title = "Connection graph",
  subtitle = "Upstream and downstream relationships for this entity",
}: {
  graph: SupplyChainGraph;
  selectedId?: string | null;
  focusId?: string | null;
  onSelect?: (nodeId: string) => void;
  title?: string;
  subtitle?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = graph.nodes.length > 1;

  return (
    <>
      <div className="dashboard-card w-full overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
              Graph
            </p>
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right font-mono text-[10px] tracking-wide text-muted uppercase">
              <p>{graph.nodes.length} nodes</p>
              <p>{graph.edges.length} links</p>
            </div>
            {canExpand ? (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink transition hover:border-accent hover:text-accent"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M8.5 2H12v3.5M5.5 12H2V8.5M12 2 8.2 5.8M2 12l3.8-3.8"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Expand
              </button>
            ) : null}
          </div>
        </div>
        {graph.nodes.length <= 1 ? (
          <div className="flex h-[480px] items-center justify-center px-6 text-center text-sm text-muted">
            No connected entities found for this item in the supply-chain graph.
          </div>
        ) : (
          <GraphFrame
            graph={graph}
            selectedId={selectedId}
            focusId={focusId}
            onSelect={onSelect}
            className="h-[560px] w-full"
          />
        )}
      </div>

      <GraphExpandModal
        open={expanded}
        onClose={() => setExpanded(false)}
        graph={graph}
        selectedId={selectedId}
        focusId={focusId}
        onSelect={onSelect}
        title={title}
        subtitle={subtitle}
      />
    </>
  );
}
