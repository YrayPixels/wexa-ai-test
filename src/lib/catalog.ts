import { propsOf, toNumber, withSession } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  EVENT_FOR_BATCH,
  LIST_BATCHES,
  LIST_CUSTOMERS,
  LIST_PRODUCTS,
  LIST_SHIPMENTS,
} from "@/lib/queries";
import type {
  BatchRow,
  CustomerRow,
  LinkedEventRef,
  ProductRow,
  ShipmentRow,
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
