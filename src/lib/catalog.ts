import { propsOf, toNumber, withSession } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  graphFromPaths,
  mergeConnectionsIntoGraph,
  nodeSubtitle,
  nodeTitle,
  pickLabel,
} from "@/lib/graph";
import {
  ENTITY_NEIGHBORHOOD,
  EVENT_FOR_BATCH,
  EVENTS_FOR_ENTITY,
  LIST_BATCHES,
  LIST_CUSTOMERS,
  LIST_MATERIALS,
  LIST_ORDERS,
  LIST_PRODUCTS,
  LIST_PRODUCTION,
  LIST_SHIPMENTS,
  LIST_SUPPLIERS,
} from "@/lib/queries";
import type {
  BatchRow,
  CatalogEntityDetail,
  CatalogKind,
  CustomerRow,
  EntityConnection,
  LinkedEventRef,
  MaterialRow,
  NodeLabel,
  OrderRow,
  ProductRow,
  ProductionRow,
  ShipmentRow,
  SupplierRow,
} from "@/lib/types";

function mapLinkedEvent(
  value: Record<string, unknown> | null | undefined,
): LinkedEventRef | null {
  if (!value || value.id == null) return null;
  return {
    id: String(value.id),
    type: String(value.type ?? ""),
    severity: value.severity as LinkedEventRef["severity"],
    status: value.status
      ? (value.status as LinkedEventRef["status"])
      : undefined,
  };
}

function mapLinkedEvents(value: unknown): LinkedEventRef[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      mapLinkedEvent(
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : null,
      ),
    )
    .filter((item): item is LinkedEventRef => item != null);
}

function labelToKind(label: NodeLabel): CatalogKind | null {
  switch (label) {
    case "Supplier":
      return "suppliers";
    case "Material":
      return "materials";
    case "MaterialBatch":
      return "batches";
    case "ProductionBatch":
      return "production";
    case "Product":
      return "products";
    case "Shipment":
      return "shipments";
    case "Order":
      return "orders";
    case "Customer":
      return "customers";
    default:
      return null;
  }
}

export async function listSuppliers(): Promise<SupplierRow[]> {
  return withSession(async (session) => {
    const result = await session.run(LIST_SUPPLIERS);
    return result.records.map((record) => {
      const supplier = propsOf(record.get("supplier"));
      return {
        id: String(supplier.id),
        name: String(supplier.name ?? ""),
        location: String(supplier.location ?? ""),
        materialCount: toNumber(record.get("materialCount")),
        batchCount: toNumber(record.get("batchCount")),
        events: mapLinkedEvents(record.get("events")),
      };
    });
  });
}

export async function listMaterials(): Promise<MaterialRow[]> {
  return withSession(async (session) => {
    const result = await session.run(LIST_MATERIALS);
    return result.records.map((record) => {
      const material = propsOf(record.get("material"));
      return {
        id: String(material.id),
        name: String(material.name ?? ""),
        category: String(material.category ?? ""),
        supplierName: record.get("supplierName")
          ? String(record.get("supplierName"))
          : null,
        batchCount: toNumber(record.get("batchCount")),
        events: mapLinkedEvents(record.get("events")),
      };
    });
  });
}

export async function listBatches(): Promise<BatchRow[]> {
  return withSession(async (session) => {
    const result = await session.run(LIST_BATCHES);
    return result.records.map((record) => {
      const batch = propsOf(record.get("batch"));
      return {
        id: String(batch.id),
        batchNumber: String(batch.batchNumber),
        manufactureDate: String(batch.manufactureDate ?? ""),
        expiryDate: String(batch.expiryDate ?? ""),
        status: String(batch.status ?? ""),
        materialName: String(record.get("materialName") ?? ""),
        supplierName: String(record.get("supplierName") ?? ""),
        event: mapLinkedEvent(
          record.get("event")
            ? propsOf(record.get("event") as Record<string, unknown>)
            : null,
        ),
      };
    });
  });
}

export async function listProduction(): Promise<ProductionRow[]> {
  return withSession(async (session) => {
    const result = await session.run(LIST_PRODUCTION);
    return result.records.map((record) => {
      const production = propsOf(record.get("production"));
      return {
        id: String(production.id),
        batchNumber: String(production.batchNumber ?? ""),
        productionDate: String(production.productionDate ?? ""),
        facility: String(production.facility ?? ""),
        productSku: record.get("productSku")
          ? String(record.get("productSku"))
          : null,
        productName: record.get("productName")
          ? String(record.get("productName"))
          : null,
        materialBatch: record.get("materialBatch")
          ? String(record.get("materialBatch"))
          : null,
        events: mapLinkedEvents(record.get("events")),
      };
    });
  });
}

export async function listProducts(): Promise<ProductRow[]> {
  return withSession(async (session) => {
    const result = await session.run(LIST_PRODUCTS);
    return result.records.map((record) => {
      const product = propsOf(record.get("product"));
      return {
        id: String(product.id),
        sku: String(product.sku ?? ""),
        name: String(product.name ?? ""),
        category: String(product.category ?? ""),
        productionBatch: record.get("productionBatch")
          ? String(record.get("productionBatch"))
          : null,
        materialBatch: record.get("materialBatch")
          ? String(record.get("materialBatch"))
          : null,
        events: mapLinkedEvents(record.get("events")),
      };
    });
  });
}

export async function listShipments(): Promise<ShipmentRow[]> {
  return withSession(async (session) => {
    const result = await session.run(LIST_SHIPMENTS);
    return result.records.map((record) => {
      const shipment = propsOf(record.get("shipment"));
      return {
        id: String(shipment.id),
        shippedAt: String(shipment.shippedAt ?? ""),
        quantity: toNumber(shipment.quantity),
        status: String(shipment.status ?? ""),
        productSku: record.get("productSku")
          ? String(record.get("productSku"))
          : null,
        productName: record.get("productName")
          ? String(record.get("productName"))
          : null,
        orderNumber: record.get("orderNumber")
          ? String(record.get("orderNumber"))
          : null,
        customerName: record.get("customerName")
          ? String(record.get("customerName"))
          : null,
        events: mapLinkedEvents(record.get("events")),
      };
    });
  });
}

export async function listOrders(): Promise<OrderRow[]> {
  return withSession(async (session) => {
    const result = await session.run(LIST_ORDERS);
    return result.records.map((record) => {
      const order = propsOf(record.get("order"));
      return {
        id: String(order.id),
        orderNumber: String(order.orderNumber ?? ""),
        orderDate: String(order.orderDate ?? ""),
        status: String(order.status ?? ""),
        customerName: record.get("customerName")
          ? String(record.get("customerName"))
          : null,
        shipmentCount: toNumber(record.get("shipmentCount")),
        events: mapLinkedEvents(record.get("events")),
      };
    });
  });
}

export async function listCustomers(): Promise<CustomerRow[]> {
  return withSession(async (session) => {
    const result = await session.run(LIST_CUSTOMERS);
    return result.records.map((record) => {
      const customer = propsOf(record.get("customer"));
      return {
        id: String(customer.id),
        name: String(customer.name ?? ""),
        region: String(customer.region ?? ""),
        orderCount: toNumber(record.get("orderCount")),
        shipmentCount: toNumber(record.get("shipmentCount")),
        events: mapLinkedEvents(record.get("events")),
      };
    });
  });
}

export async function getEventIdForBatch(
  batchId: string,
): Promise<{ batchId: string; batchNumber: string; eventId: string | null }> {
  return withSession(async (session) => {
    const result = await session.run(EVENT_FOR_BATCH, { batchId });
    if (result.records.length === 0) {
      throw new AppError("Batch not found.", 404, "NOT_FOUND");
    }
    const batch = propsOf(result.records[0].get("batch"));
    const eventId = result.records[0].get("eventId");
    return {
      batchId: String(batch.id),
      batchNumber: String(batch.batchNumber),
      eventId: eventId == null ? null : String(eventId),
    };
  });
}

export async function getCatalogEntityDetail(
  id: string,
  expectedKind?: CatalogKind,
): Promise<CatalogEntityDetail> {
  return withSession(async (session) => {
    const result = await session.run(ENTITY_NEIGHBORHOOD, { id });
    if (result.records.length === 0) {
      throw new AppError("Entity not found.", 404, "NOT_FOUND");
    }

    const record = result.records[0];
    const node = record.get("n") as {
      labels?: string[];
      properties: Record<string, unknown>;
    };
    const labels = (record.get("labels") as string[]) ?? node.labels ?? [];
    const label = pickLabel(labels);
    const kind = labelToKind(label);
    if (!kind) {
      throw new AppError(
        "Entity type is not browsable in the catalog.",
        400,
        "BAD_REQUEST",
      );
    }
    if (expectedKind && kind !== expectedKind) {
      throw new AppError("Entity type mismatch.", 404, "NOT_FOUND");
    }

    const properties = propsOf(node.properties);
    const entityId = String(properties.id ?? id);
    const title = nodeTitle(label, properties);
    const subtitle = nodeSubtitle(label, properties);

    const rawConnections =
      (record.get("connections") as Array<{
        type?: string;
        direction?: string;
        neighbor?: {
          labels?: string[];
          properties?: Record<string, unknown>;
        };
      }>) ?? [];

    const connections: EntityConnection[] = rawConnections
      .filter((item) => item?.neighbor && item.type)
      .map((item) => {
        const neighbor = item.neighbor!;
        const neighborLabel = pickLabel(neighbor.labels ?? []);
        const neighborProps = propsOf(neighbor.properties);
        return {
          type: String(item.type ?? "RELATED"),
          direction: (item.direction === "IN" ? "IN" : "OUT") as "IN" | "OUT",
          id: String(neighborProps.id ?? ""),
          label: neighborLabel,
          title: nodeTitle(neighborLabel, neighborProps),
          subtitle: nodeSubtitle(neighborLabel, neighborProps),
        };
      })
      .filter((item) => item.id);

    const upPaths = (record.get("upPaths") as unknown[]) ?? [];
    const downPaths = (record.get("downPaths") as unknown[]) ?? [];
    const pathGraph = graphFromPaths(
      [...upPaths, ...downPaths] as Parameters<typeof graphFromPaths>[0],
      [{ labels, properties: node.properties }],
    );

    const graph = mergeConnectionsIntoGraph(
      pathGraph,
      {
        id: entityId,
        label,
        title,
        subtitle,
        data: properties,
      },
      connections,
    );

    let events: LinkedEventRef[] = [];
    try {
      const eventResult = await session.run(EVENTS_FOR_ENTITY, { id });
      events = eventResult.records
        .map((eventRecord) =>
          mapLinkedEvent(
            propsOf(eventRecord.get("event") as Record<string, unknown>),
          ),
        )
        .filter((item): item is LinkedEventRef => item != null);
    } catch {
      events = graph.nodes
        .filter((n) => n.label === "QualityEvent")
        .map((n) =>
          mapLinkedEvent({
            id: n.id,
            type: n.title,
            severity: n.data.severity,
            status: n.data.status,
          }),
        )
        .filter((item): item is LinkedEventRef => item != null);
    }

    const seen = new Set<string>();
    events = events.filter((event) => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    });

    return {
      id: entityId,
      kind,
      label,
      title,
      subtitle,
      properties,
      connections,
      events,
      graph,
    };
  });
}
