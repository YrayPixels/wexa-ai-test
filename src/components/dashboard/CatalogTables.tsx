"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCommonUpstreamSelection } from "@/components/dashboard/CommonUpstreamModal";
import { EventPills, SmartDataTable } from "@/components/dashboard/DataTable";
import { SeverityBadge } from "@/components/SeverityBadge";
import { ErrorState, LoadingState } from "@/components/States";
import type {
  BatchRow,
  CustomerRow,
  MaterialRow,
  OrderRow,
  ProductRow,
  ProductionRow,
  QualityEvent,
  ShipmentRow,
  SupplierRow,
} from "@/lib/types";

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.filter((v): v is string => Boolean(v && v.trim()))),
  ).sort((a, b) => a.localeCompare(b));
}

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
  const filters = useMemo(
    () => [
      {
        id: "severity",
        label: "Severity",
        options: uniqueSorted(events.map((e) => e.severity)).map((v) => ({
          value: v,
          label: v,
        })),
      },
      {
        id: "status",
        label: "Status",
        options: uniqueSorted(events.map((e) => e.status)).map((v) => ({
          value: v,
          label: v,
        })),
      },
    ],
    [events],
  );

  if (loading) return <LoadingState label="Loading events…" />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  return (
    <SmartDataTable
      rows={events}
      toolbarLabel="Events table"
      searchPlaceholder="Search events, batches, types…"
      activeId={selectedId}
      empty="No quality events match your search or filters."
      onRowClick={(event) => onSelect(event.id)}
      searchFn={(event, q) =>
        [event.id, event.batchNumber, event.type, event.status, event.description]
          .join(" ")
          .toLowerCase()
          .includes(q)
      }
      filters={filters}
      filterFn={(event, selected) => {
        if (selected.severity !== "all" && event.severity !== selected.severity) {
          return false;
        }
        if (selected.status !== "all" && event.status !== selected.status) {
          return false;
        }
        return true;
      }}
      columns={[
        {
          id: "event",
          header: "Event",
          cell: (event) => (
            <span className="font-mono text-xs text-accent">{event.id}</span>
          ),
        },
        {
          id: "batch",
          header: "Batch",
          cell: (event) => (
            <span className="font-semibold text-ink">{event.batchNumber}</span>
          ),
        },
        {
          id: "type",
          header: "Type",
          cell: (event) => event.type,
        },
        {
          id: "severity",
          header: "Severity",
          cell: (event) => <SeverityBadge severity={event.severity} />,
        },
        {
          id: "status",
          header: "Status",
          cell: (event) => <span className="text-muted">{event.status}</span>,
        },
        {
          id: "reported",
          header: "Reported",
          cell: (event) => (
            <span className="font-mono text-xs text-muted">{event.reportedAt}</span>
          ),
        },
      ]}
    />
  );
}

export function SuppliersTable({
  onOpenEvent,
}: {
  onOpenEvent: (eventId: string) => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const common = useCommonUpstreamSelection(rows, {
    label: "Supplier",
    noun: "suppliers",
    chip: (row) => row.name,
  });

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/catalog/suppliers")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Failed to load suppliers");
        setRows(payload.suppliers as SupplierRow[]);
      })
      .catch((err: unknown) => {
        setRows([]);
        setError(err instanceof Error ? err.message : "Failed to load suppliers");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filters = useMemo(
    () => [
      {
        id: "location",
        label: "Location",
        options: uniqueSorted(rows.map((r) => r.location)).map((v) => ({
          value: v,
          label: v,
        })),
      },
      {
        id: "affected",
        label: "Impact",
        options: [
          { value: "linked", label: "Linked to event" },
          { value: "clear", label: "No linked event" },
        ],
      },
    ],
    [rows],
  );

  if (loading) return <LoadingState label="Loading suppliers…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
    <SmartDataTable
      rows={rows}
      toolbarLabel="Suppliers table"
      searchPlaceholder="Search supplier name, location, ID…"
      empty="No suppliers match your search or filters."
      onRowClick={(supplier) => router.push(`/suppliers/${supplier.id}`)}
      {...common.selectionProps}
      searchFn={(supplier, q) =>
        [
          supplier.id,
          supplier.name,
          supplier.location,
          ...supplier.events.map((e) => e.id),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      }
      filters={filters}
      filterFn={(supplier, selected) => {
        if (selected.location !== "all" && supplier.location !== selected.location) {
          return false;
        }
        if (selected.affected === "linked" && supplier.events.length === 0) return false;
        if (selected.affected === "clear" && supplier.events.length > 0) return false;
        return true;
      }}
      columns={[
        {
          id: "supplier",
          header: "Supplier",
          cell: (supplier) => (
            <div>
              <p className="font-semibold text-ink">{supplier.name}</p>
              <p className="font-mono text-[10px] text-muted">{supplier.id}</p>
            </div>
          ),
        },
        {
          id: "location",
          header: "Location",
          cell: (supplier) => <span className="text-muted">{supplier.location}</span>,
        },
        {
          id: "materials",
          header: "Materials",
          cell: (supplier) => (
            <span className="tabular-nums">{supplier.materialCount}</span>
          ),
        },
        {
          id: "batches",
          header: "Batches",
          cell: (supplier) => (
            <span className="tabular-nums">{supplier.batchCount}</span>
          ),
        },
        {
          id: "events",
          header: "Linked events",
          cell: (supplier) => (
            <EventPills events={supplier.events} onOpenEvent={onOpenEvent} />
          ),
        },
      ]}
    />
    {common.modal}
    </>
  );
}

export function MaterialsTable({
  onOpenEvent,
}: {
  onOpenEvent: (eventId: string) => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const common = useCommonUpstreamSelection(rows, {
    label: "Material",
    noun: "materials",
    chip: (row) => row.name,
  });

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/catalog/materials")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Failed to load materials");
        setRows(payload.materials as MaterialRow[]);
      })
      .catch((err: unknown) => {
        setRows([]);
        setError(err instanceof Error ? err.message : "Failed to load materials");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filters = useMemo(
    () => [
      {
        id: "category",
        label: "Category",
        options: uniqueSorted(rows.map((r) => r.category)).map((v) => ({
          value: v,
          label: v,
        })),
      },
      {
        id: "supplier",
        label: "Supplier",
        options: uniqueSorted(rows.map((r) => r.supplierName)).map((v) => ({
          value: v,
          label: v,
        })),
      },
      {
        id: "affected",
        label: "Impact",
        options: [
          { value: "linked", label: "Linked to event" },
          { value: "clear", label: "No linked event" },
        ],
      },
    ],
    [rows],
  );

  if (loading) return <LoadingState label="Loading materials…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
    <SmartDataTable
      rows={rows}
      toolbarLabel="Materials table"
      searchPlaceholder="Search material, category, supplier…"
      empty="No materials match your search or filters."
      onRowClick={(material) => router.push(`/materials/${material.id}`)}
      {...common.selectionProps}
      searchFn={(material, q) =>
        [
          material.id,
          material.name,
          material.category,
          material.supplierName,
          ...material.events.map((e) => e.id),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      }
      filters={filters}
      filterFn={(material, selected) => {
        if (selected.category !== "all" && material.category !== selected.category) {
          return false;
        }
        if (
          selected.supplier !== "all" &&
          material.supplierName !== selected.supplier
        ) {
          return false;
        }
        if (selected.affected === "linked" && material.events.length === 0) return false;
        if (selected.affected === "clear" && material.events.length > 0) return false;
        return true;
      }}
      columns={[
        {
          id: "material",
          header: "Material",
          cell: (material) => (
            <div>
              <p className="font-semibold text-ink">{material.name}</p>
              <p className="font-mono text-[10px] text-muted">{material.id}</p>
            </div>
          ),
        },
        {
          id: "category",
          header: "Category",
          cell: (material) => <span className="text-muted">{material.category}</span>,
        },
        {
          id: "supplier",
          header: "Supplier",
          cell: (material) => (
            <span className="text-muted">{material.supplierName ?? "—"}</span>
          ),
        },
        {
          id: "batches",
          header: "Batches",
          cell: (material) => (
            <span className="tabular-nums">{material.batchCount}</span>
          ),
        },
        {
          id: "events",
          header: "Linked events",
          cell: (material) => (
            <EventPills events={material.events} onOpenEvent={onOpenEvent} />
          ),
        },
      ]}
    />
    {common.modal}
    </>
  );
}

export function BatchesTable({
  onOpenEvent,
}: {
  onOpenEvent: (eventId: string) => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const common = useCommonUpstreamSelection(rows, {
    label: "MaterialBatch",
    noun: "batches",
    chip: (row) => row.batchNumber,
  });

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

  const filters = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        options: uniqueSorted(rows.map((r) => r.status)).map((v) => ({
          value: v,
          label: v,
        })),
      },
      {
        id: "affected",
        label: "Impact",
        options: [
          { value: "linked", label: "Linked to event" },
          { value: "clear", label: "No linked event" },
        ],
      },
      {
        id: "supplier",
        label: "Supplier",
        options: uniqueSorted(rows.map((r) => r.supplierName)).map((v) => ({
          value: v,
          label: v,
        })),
      },
    ],
    [rows],
  );

  if (loading) return <LoadingState label="Loading batches…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
    <SmartDataTable
      rows={rows}
      toolbarLabel="Batches table"
      searchPlaceholder="Search batch number, material, supplier…"
      empty="No batches match your search or filters."
      onRowClick={(batch) => router.push(`/batches/${batch.id}`)}
      {...common.selectionProps}
      searchFn={(batch, q) =>
        [
          batch.id,
          batch.batchNumber,
          batch.materialName,
          batch.supplierName,
          batch.status,
          batch.event?.id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      }
      filters={filters}
      filterFn={(batch, selected) => {
        if (selected.status !== "all" && batch.status !== selected.status) return false;
        if (selected.supplier !== "all" && batch.supplierName !== selected.supplier) {
          return false;
        }
        if (selected.affected === "linked" && !batch.event) return false;
        if (selected.affected === "clear" && batch.event) return false;
        return true;
      }}
      columns={[
        {
          id: "batch",
          header: "Batch",
          cell: (batch) => (
            <div>
              <p className="font-semibold text-ink">{batch.batchNumber}</p>
              <p className="font-mono text-[10px] text-muted">{batch.id}</p>
            </div>
          ),
        },
        {
          id: "material",
          header: "Material",
          cell: (batch) => batch.materialName,
        },
        {
          id: "supplier",
          header: "Supplier",
          cell: (batch) => <span className="text-muted">{batch.supplierName}</span>,
        },
        {
          id: "status",
          header: "Status",
          cell: (batch) => batch.status,
        },
        {
          id: "manufactured",
          header: "Manufactured",
          cell: (batch) => (
            <span className="font-mono text-xs text-muted">{batch.manufactureDate}</span>
          ),
        },
        {
          id: "event",
          header: "Linked event",
          cell: (batch) =>
            batch.event ? (
              <EventPills events={[batch.event]} onOpenEvent={onOpenEvent} />
            ) : (
              <span className="text-xs text-muted">No linked event</span>
            ),
        },
      ]}
    />
    {common.modal}
    </>
  );
}

export function ProductionTable({
  onOpenEvent,
}: {
  onOpenEvent: (eventId: string) => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<ProductionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const common = useCommonUpstreamSelection(rows, {
    label: "ProductionBatch",
    noun: "production batches",
    chip: (row) => row.batchNumber,
  });

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/catalog/production")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load production batches");
        }
        setRows(payload.production as ProductionRow[]);
      })
      .catch((err: unknown) => {
        setRows([]);
        setError(
          err instanceof Error ? err.message : "Failed to load production batches",
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filters = useMemo(
    () => [
      {
        id: "facility",
        label: "Facility",
        options: uniqueSorted(rows.map((r) => r.facility)).map((v) => ({
          value: v,
          label: v,
        })),
      },
      {
        id: "affected",
        label: "Impact",
        options: [
          { value: "linked", label: "Linked to event" },
          { value: "clear", label: "No linked event" },
        ],
      },
    ],
    [rows],
  );

  if (loading) return <LoadingState label="Loading production batches…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
    <SmartDataTable
      rows={rows}
      toolbarLabel="Production table"
      searchPlaceholder="Search production batch, facility, product…"
      empty="No production batches match your search or filters."
      onRowClick={(row) => router.push(`/production/${row.id}`)}
      {...common.selectionProps}
      searchFn={(row, q) =>
        [
          row.id,
          row.batchNumber,
          row.facility,
          row.productSku,
          row.productName,
          row.materialBatch,
          ...row.events.map((e) => e.id),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      }
      filters={filters}
      filterFn={(row, selected) => {
        if (selected.facility !== "all" && row.facility !== selected.facility) {
          return false;
        }
        if (selected.affected === "linked" && row.events.length === 0) return false;
        if (selected.affected === "clear" && row.events.length > 0) return false;
        return true;
      }}
      columns={[
        {
          id: "batch",
          header: "Production batch",
          cell: (row) => (
            <div>
              <p className="font-semibold text-ink">{row.batchNumber}</p>
              <p className="font-mono text-[10px] text-muted">{row.id}</p>
            </div>
          ),
        },
        {
          id: "facility",
          header: "Facility",
          cell: (row) => <span className="text-muted">{row.facility}</span>,
        },
        {
          id: "product",
          header: "Product",
          cell: (row) => (
            <div>
              <p className="font-semibold text-ink">{row.productName ?? "—"}</p>
              <p className="font-mono text-[10px] text-muted">{row.productSku}</p>
            </div>
          ),
        },
        {
          id: "material",
          header: "Material batch",
          cell: (row) => (
            <span className="font-mono text-xs text-muted">
              {row.materialBatch ?? "—"}
            </span>
          ),
        },
        {
          id: "date",
          header: "Produced",
          cell: (row) => (
            <span className="font-mono text-xs text-muted">{row.productionDate}</span>
          ),
        },
        {
          id: "events",
          header: "Linked events",
          cell: (row) => (
            <EventPills events={row.events} onOpenEvent={onOpenEvent} />
          ),
        },
      ]}
    />
    {common.modal}
    </>
  );
}

export function ProductsTable({
  onOpenEvent,
}: {
  onOpenEvent: (eventId: string) => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const common = useCommonUpstreamSelection(rows, {
    label: "Product",
    noun: "products",
    chip: (row) => row.sku,
  });

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

  const filters = useMemo(
    () => [
      {
        id: "category",
        label: "Category",
        options: uniqueSorted(rows.map((r) => r.category)).map((v) => ({
          value: v,
          label: v,
        })),
      },
      {
        id: "affected",
        label: "Impact",
        options: [
          { value: "linked", label: "Linked to event" },
          { value: "clear", label: "No linked event" },
        ],
      },
    ],
    [rows],
  );

  if (loading) return <LoadingState label="Loading products…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <SmartDataTable
        rows={rows}
        toolbarLabel="Products table"
        searchPlaceholder="Search SKU, name, batch…"
        empty="No products match your search or filters."
        onRowClick={(product) => router.push(`/products/${product.id}`)}
        {...common.selectionProps}
        searchFn={(product, q) =>
          [
            product.id,
            product.sku,
            product.name,
            product.category,
            product.materialBatch,
            ...product.events.map((e) => e.id),
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
        }
        filters={filters}
        filterFn={(product, selected) => {
          if (selected.category !== "all" && product.category !== selected.category) {
            return false;
          }
          if (selected.affected === "linked" && product.events.length === 0) return false;
          if (selected.affected === "clear" && product.events.length > 0) return false;
          return true;
        }}
        columns={[
          {
            id: "sku",
            header: "SKU",
            cell: (product) => (
              <span className="font-mono text-xs">{product.sku}</span>
            ),
          },
          {
            id: "name",
            header: "Product",
            cell: (product) => (
              <span className="font-semibold text-ink">{product.name}</span>
            ),
          },
          {
            id: "category",
            header: "Category",
            cell: (product) => <span className="text-muted">{product.category}</span>,
          },
          {
            id: "batch",
            header: "Material batch",
            cell: (product) => (
              <span className="font-mono text-xs text-muted">
                {product.materialBatch ?? "—"}
              </span>
            ),
          },
          {
            id: "events",
            header: "Linked events",
            cell: (product) => (
              <EventPills events={product.events} onOpenEvent={onOpenEvent} />
            ),
          },
        ]}
      />
      {common.modal}
    </>
  );
}

export function ShipmentsTable({
  onOpenEvent,
}: {
  onOpenEvent: (eventId: string) => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<ShipmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const common = useCommonUpstreamSelection(rows, {
    label: "Shipment",
    noun: "shipments",
    chip: (row) => row.id,
  });

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

  const filters = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        options: uniqueSorted(rows.map((r) => r.status)).map((v) => ({
          value: v,
          label: v,
        })),
      },
      {
        id: "affected",
        label: "Impact",
        options: [
          { value: "linked", label: "Linked to event" },
          { value: "clear", label: "No linked event" },
        ],
      },
    ],
    [rows],
  );

  if (loading) return <LoadingState label="Loading shipments…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
    <SmartDataTable
      rows={rows}
      toolbarLabel="Shipments table"
      searchPlaceholder="Search shipment, product, customer…"
      empty="No shipments match your search or filters."
      onRowClick={(shipment) => router.push(`/shipments/${shipment.id}`)}
      {...common.selectionProps}
      searchFn={(shipment, q) =>
        [
          shipment.id,
          shipment.productSku,
          shipment.productName,
          shipment.customerName,
          shipment.orderNumber,
          shipment.status,
          ...shipment.events.map((e) => e.id),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      }
      filters={filters}
      filterFn={(shipment, selected) => {
        if (selected.status !== "all" && shipment.status !== selected.status) {
          return false;
        }
        if (selected.affected === "linked" && shipment.events.length === 0) return false;
        if (selected.affected === "clear" && shipment.events.length > 0) return false;
        return true;
      }}
      columns={[
        {
          id: "shipment",
          header: "Shipment",
          cell: (shipment) => (
            <div>
              <p className="font-mono text-xs text-ink">{shipment.id}</p>
              <p className="text-[11px] text-muted">{shipment.shippedAt}</p>
            </div>
          ),
        },
        {
          id: "product",
          header: "Product",
          cell: (shipment) => (
            <div>
              <p className="font-semibold text-ink">{shipment.productName ?? "—"}</p>
              <p className="font-mono text-[10px] text-muted">{shipment.productSku}</p>
            </div>
          ),
        },
        {
          id: "customer",
          header: "Customer",
          cell: (shipment) => (
            <span className="text-muted">{shipment.customerName ?? "—"}</span>
          ),
        },
        {
          id: "qty",
          header: "Qty",
          cell: (shipment) => (
            <span className="tabular-nums">{shipment.quantity}</span>
          ),
        },
        {
          id: "status",
          header: "Status",
          cell: (shipment) => shipment.status,
        },
        {
          id: "events",
          header: "Linked events",
          cell: (shipment) => (
            <EventPills events={shipment.events} onOpenEvent={onOpenEvent} />
          ),
        },
      ]}
    />
    {common.modal}
    </>
  );
}

export function OrdersTable({
  onOpenEvent,
}: {
  onOpenEvent: (eventId: string) => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const common = useCommonUpstreamSelection(rows, {
    label: "Order",
    noun: "orders",
    chip: (row) => row.orderNumber,
  });

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/catalog/orders")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Failed to load orders");
        setRows(payload.orders as OrderRow[]);
      })
      .catch((err: unknown) => {
        setRows([]);
        setError(err instanceof Error ? err.message : "Failed to load orders");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filters = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        options: uniqueSorted(rows.map((r) => r.status)).map((v) => ({
          value: v,
          label: v,
        })),
      },
      {
        id: "affected",
        label: "Impact",
        options: [
          { value: "linked", label: "Linked to event" },
          { value: "clear", label: "No linked event" },
        ],
      },
    ],
    [rows],
  );

  if (loading) return <LoadingState label="Loading orders…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
    <SmartDataTable
      rows={rows}
      toolbarLabel="Orders table"
      searchPlaceholder="Search order number, customer, status…"
      empty="No orders match your search or filters."
      onRowClick={(order) => router.push(`/orders/${order.id}`)}
      {...common.selectionProps}
      searchFn={(order, q) =>
        [
          order.id,
          order.orderNumber,
          order.customerName,
          order.status,
          ...order.events.map((e) => e.id),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      }
      filters={filters}
      filterFn={(order, selected) => {
        if (selected.status !== "all" && order.status !== selected.status) {
          return false;
        }
        if (selected.affected === "linked" && order.events.length === 0) return false;
        if (selected.affected === "clear" && order.events.length > 0) return false;
        return true;
      }}
      columns={[
        {
          id: "order",
          header: "Order",
          cell: (order) => (
            <div>
              <p className="font-semibold text-ink">{order.orderNumber}</p>
              <p className="font-mono text-[10px] text-muted">{order.id}</p>
            </div>
          ),
        },
        {
          id: "customer",
          header: "Customer",
          cell: (order) => (
            <span className="text-muted">{order.customerName ?? "—"}</span>
          ),
        },
        {
          id: "date",
          header: "Ordered",
          cell: (order) => (
            <span className="font-mono text-xs text-muted">{order.orderDate}</span>
          ),
        },
        {
          id: "status",
          header: "Status",
          cell: (order) => order.status,
        },
        {
          id: "shipments",
          header: "Shipments",
          cell: (order) => (
            <span className="tabular-nums">{order.shipmentCount}</span>
          ),
        },
        {
          id: "events",
          header: "Linked events",
          cell: (order) => (
            <EventPills events={order.events} onOpenEvent={onOpenEvent} />
          ),
        },
      ]}
    />
    {common.modal}
    </>
  );
}

export function CustomersTable({
  onOpenEvent,
}: {
  onOpenEvent: (eventId: string) => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const common = useCommonUpstreamSelection(rows, {
    label: "Customer",
    noun: "customers",
    chip: (row) => row.name,
  });

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

  const filters = useMemo(
    () => [
      {
        id: "region",
        label: "Region",
        options: uniqueSorted(rows.map((r) => r.region)).map((v) => ({
          value: v,
          label: v,
        })),
      },
      {
        id: "affected",
        label: "Impact",
        options: [
          { value: "linked", label: "Linked to event" },
          { value: "clear", label: "No linked event" },
        ],
      },
    ],
    [rows],
  );

  if (loading) return <LoadingState label="Loading customers…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
    <SmartDataTable
      rows={rows}
      toolbarLabel="Customers table"
      searchPlaceholder="Search customer name, region, ID…"
      empty="No customers match your search or filters."
      onRowClick={(customer) => router.push(`/customers/${customer.id}`)}
      {...common.selectionProps}
      searchFn={(customer, q) =>
        [
          customer.id,
          customer.name,
          customer.region,
          ...customer.events.map((e) => e.id),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      }
      filters={filters}
      filterFn={(customer, selected) => {
        if (selected.region !== "all" && customer.region !== selected.region) {
          return false;
        }
        if (selected.affected === "linked" && customer.events.length === 0) return false;
        if (selected.affected === "clear" && customer.events.length > 0) return false;
        return true;
      }}
      columns={[
        {
          id: "customer",
          header: "Customer",
          cell: (customer) => (
            <div>
              <p className="font-semibold text-ink">{customer.name}</p>
              <p className="font-mono text-[10px] text-muted">{customer.id}</p>
            </div>
          ),
        },
        {
          id: "region",
          header: "Region",
          cell: (customer) => <span className="text-muted">{customer.region}</span>,
        },
        {
          id: "orders",
          header: "Orders",
          cell: (customer) => (
            <span className="tabular-nums">{customer.orderCount}</span>
          ),
        },
        {
          id: "shipments",
          header: "Shipments",
          cell: (customer) => (
            <span className="tabular-nums">{customer.shipmentCount}</span>
          ),
        },
        {
          id: "events",
          header: "Linked events",
          cell: (customer) => (
            <EventPills events={customer.events} onOpenEvent={onOpenEvent} />
          ),
        },
      ]}
    />
    {common.modal}
    </>
  );
}
