export type Severity = "Critical" | "Medium" | "Low";
export type EventStatus = "Open" | "Under Investigation" | "Resolved";

export type NodeLabel =
  | "Supplier"
  | "Material"
  | "MaterialBatch"
  | "ProductionBatch"
  | "Product"
  | "Shipment"
  | "Order"
  | "Customer"
  | "QualityEvent";

export interface QualityEvent {
  id: string;
  type: string;
  description: string;
  severity: Severity;
  reportedAt: string;
  status: EventStatus;
  batchId: string;
  batchNumber: string;
}

export interface ImpactSummary {
  productionBatches: number;
  products: number;
  shipments: number;
  orders: number;
  customers: number;
}

export interface GraphNode {
  id: string;
  label: NodeLabel;
  title: string;
  subtitle?: string;
  data: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface SupplyChainGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface TraceStep {
  id: string;
  label: NodeLabel;
  title: string;
  subtitle?: string;
}

export interface InvestigationDetail {
  event: QualityEvent;
  impact: ImpactSummary;
  graph: SupplyChainGraph;
}

export interface EntityDetail {
  id: string;
  label: NodeLabel;
  title: string;
  properties: Record<string, unknown>;
}
