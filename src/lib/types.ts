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

export type DashboardSection =
  | "events"
  | "suppliers"
  | "materials"
  | "batches"
  | "production"
  | "products"
  | "shipments"
  | "orders"
  | "customers";

export interface LinkedEventRef {
  id: string;
  type: string;
  severity: Severity;
  status?: EventStatus;
}

export interface SupplierRow {
  id: string;
  name: string;
  location: string;
  materialCount: number;
  batchCount: number;
  events: LinkedEventRef[];
}

export interface MaterialRow {
  id: string;
  name: string;
  category: string;
  supplierName: string | null;
  batchCount: number;
  events: LinkedEventRef[];
}

export interface BatchRow {
  id: string;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  status: string;
  materialName: string;
  supplierName: string;
  event: LinkedEventRef | null;
}

export interface ProductionRow {
  id: string;
  batchNumber: string;
  productionDate: string;
  facility: string;
  productSku: string | null;
  productName: string | null;
  materialBatch: string | null;
  events: LinkedEventRef[];
}

export interface ProductRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  productionBatch: string | null;
  materialBatch: string | null;
  events: LinkedEventRef[];
}

export interface ShipmentRow {
  id: string;
  shippedAt: string;
  quantity: number;
  status: string;
  productSku: string | null;
  productName: string | null;
  orderNumber: string | null;
  customerName: string | null;
  events: LinkedEventRef[];
}

export interface OrderRow {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  customerName: string | null;
  shipmentCount: number;
  events: LinkedEventRef[];
}

export interface CustomerRow {
  id: string;
  name: string;
  region: string;
  orderCount: number;
  shipmentCount: number;
  events: LinkedEventRef[];
}

export type CatalogKind =
  | "suppliers"
  | "materials"
  | "batches"
  | "production"
  | "products"
  | "shipments"
  | "orders"
  | "customers";

export interface EntityConnection {
  type: string;
  direction: "IN" | "OUT";
  id: string;
  label: NodeLabel;
  title: string;
  subtitle?: string;
}

export interface CatalogEntityDetail {
  id: string;
  kind: CatalogKind;
  label: NodeLabel;
  title: string;
  subtitle?: string;
  properties: Record<string, unknown>;
  connections: EntityConnection[];
  events: LinkedEventRef[];
  graph: SupplyChainGraph;
}
