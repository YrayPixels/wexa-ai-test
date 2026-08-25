"use client";

import { useEffect, useState } from "react";
import {
  DataTable,
  EventPills,
  TableRowButton,
} from "@/components/dashboard/DataTable";
import { SeverityBadge } from "@/components/SeverityBadge";
import { ErrorState, LoadingState } from "@/components/States";
import type {
  BatchRow,
  CustomerRow,
  ProductRow,
  QualityEvent,
  ShipmentRow,
} from "@/lib/types";

export function EventsTable({
  events,
  selectedId,
  loading,
  error,
  onRetry,
  onSelect,
}: {
  events: QualityEvent[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelect: (eventId: string) => void;
}) {
  if (loading) return <LoadingState label="Loading events…" />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  return (
    <DataTable
      columns={["Event", "Batch", "Type", "Severity", "Status", "Reported"]}
      empty="No quality events yet. Run npm run seed."
      rows={events.map((event) => (
        <TableRowButton
          key={event.id}
          active={event.id === selectedId}
          onClick={() => onSelect(event.id)}
        >
          <td className="px-4 py-3 font-mono text-xs text-accent">{event.id}</td>
          <td className="px-4 py-3 font-semibold text-ink">{event.batchNumber}</td>
          <td className="px-4 py-3">{event.type}</td>
          <td className="px-4 py-3">
            <SeverityBadge severity={event.severity} />
          </td>
          <td className="px-4 py-3 text-muted">{event.status}</td>
          <td className="px-4 py-3 font-mono text-xs text-muted">{event.reportedAt}</td>
        </TableRowButton>
      ))}
    />
  );
}

export function BatchesTable({
  selectedId,
  onSelectBatch,
  onOpenEvent,
}: {
  selectedId: string | null;
  onSelectBatch: (batch: BatchRow) => void;
  onOpenEvent: (eventId: string) => void;
}) {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/catalog/batches")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Failed to load batches");
        setRows(payload.batches as BatchRow[]);
      })
      .catch((err: unknown) => {
        setRows([]);
        setError(err instanceof Error ? err.message : "Failed to load batches");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState label="Loading batches…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <DataTable
      columns={[
        "Batch",
        "Material",
        "Supplier",
        "Status",
        "Manufactured",
        "Linked event",
      ]}
      empty="No material batches found."
      rows={rows.map((batch) => (
        <TableRowButton
          key={batch.id}
          active={batch.id === selectedId}
          onClick={() => onSelectBatch(batch)}
        >
          <td className="px-4 py-3">
            <p className="font-semibold text-ink">{batch.batchNumber}</p>
            <p className="font-mono text-[10px] text-muted">{batch.id}</p>
          </td>
          <td className="px-4 py-3">{batch.materialName}</td>
          <td className="px-4 py-3 text-muted">{batch.supplierName}</td>
          <td className="px-4 py-3">{batch.status}</td>
          <td className="px-4 py-3 font-mono text-xs text-muted">
            {batch.manufactureDate}
          </td>
          <td className="px-4 py-3">
            {batch.event ? (
              <EventPills events={[batch.event]} onOpenEvent={onOpenEvent} />
            ) : (
              <span className="text-xs text-muted">No linked event</span>
            )}
          </td>
        </TableRowButton>
      ))}
    />
  );
}

export function ProductsTable({
  onOpenEvent,
}: {
  onOpenEvent: (eventId: string) => void;
}) {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/catalog/products")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Failed to load products");
        setRows(payload.products as ProductRow[]);
      })
      .catch((err: unknown) => {
        setRows([]);
        setError(err instanceof Error ? err.message : "Failed to load products");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState label="Loading products…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <DataTable
      columns={["SKU", "Product", "Category", "Material batch", "Linked events"]}
      empty="No products found."
      rows={rows.map((product) => (
        <TableRowButton key={product.id}>
          <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
          <td className="px-4 py-3 font-semibold text-ink">{product.name}</td>
          <td className="px-4 py-3 text-muted">{product.category}</td>
          <td className="px-4 py-3 font-mono text-xs text-muted">
            {product.materialBatch ?? "—"}
          </td>
          <td className="px-4 py-3">
            <EventPills events={product.events} onOpenEvent={onOpenEvent} />
          </td>
        </TableRowButton>
      ))}
    />
  );
}

export function ShipmentsTable({
  onOpenEvent,
}: {
  onOpenEvent: (eventId: string) => void;
}) {
  const [rows, setRows] = useState<ShipmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/catalog/shipments")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Failed to load shipments");
        setRows(payload.shipments as ShipmentRow[]);
      })
      .catch((err: unknown) => {
        setRows([]);
        setError(err instanceof Error ? err.message : "Failed to load shipments");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState label="Loading shipments…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <DataTable
      columns={[
        "Shipment",
        "Product",
        "Customer",
        "Qty",
        "Status",
        "Linked events",
      ]}
      empty="No shipments found."
      rows={rows.map((shipment) => (
        <TableRowButton key={shipment.id}>
          <td className="px-4 py-3">
            <p className="font-mono text-xs text-ink">{shipment.id}</p>
            <p className="text-[11px] text-muted">{shipment.shippedAt}</p>
          </td>
          <td className="px-4 py-3">
            <p className="font-semibold text-ink">{shipment.productName ?? "—"}</p>
            <p className="font-mono text-[10px] text-muted">{shipment.productSku}</p>
          </td>
          <td className="px-4 py-3 text-muted">{shipment.customerName ?? "—"}</td>
          <td className="px-4 py-3 tabular-nums">{shipment.quantity}</td>
          <td className="px-4 py-3">{shipment.status}</td>
          <td className="px-4 py-3">
            <EventPills events={shipment.events} onOpenEvent={onOpenEvent} />
          </td>
        </TableRowButton>
      ))}
    />
  );
}

export function CustomersTable({
  onOpenEvent,
}: {
  onOpenEvent: (eventId: string) => void;
}) {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/catalog/customers")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Failed to load customers");
        setRows(payload.customers as CustomerRow[]);
      })
      .catch((err: unknown) => {
        setRows([]);
        setError(err instanceof Error ? err.message : "Failed to load customers");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState label="Loading customers…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <DataTable
      columns={["Customer", "Region", "Orders", "Shipments", "Linked events"]}
      empty="No customers found."
      rows={rows.map((customer) => (
        <TableRowButton key={customer.id}>
          <td className="px-4 py-3">
            <p className="font-semibold text-ink">{customer.name}</p>
            <p className="font-mono text-[10px] text-muted">{customer.id}</p>
          </td>
          <td className="px-4 py-3 text-muted">{customer.region}</td>
          <td className="px-4 py-3 tabular-nums">{customer.orderCount}</td>
          <td className="px-4 py-3 tabular-nums">{customer.shipmentCount}</td>
          <td className="px-4 py-3">
            <EventPills events={customer.events} onOpenEvent={onOpenEvent} />
          </td>
        </TableRowButton>
      ))}
    />
  );
}
