"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SeverityBadge } from "@/components/SeverityBadge";
import type { LinkedEventRef } from "@/lib/types";

export type FilterOption = { value: string; label: string };

export type TableFilter = {
  id: string;
  label: string;
  options: FilterOption[];
};

export type TableColumn<T> = {
  id: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
};

export function EventPills({
  events,
  onOpenEvent,
}: {
  events: LinkedEventRef[];
  onOpenEvent?: (eventId: string) => void;
}) {
  if (events.length === 0) {
    return <span className="text-xs text-muted">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {events.map((event) => (
        <button
          key={event.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenEvent?.(event.id);
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-left transition hover:bg-accent/15"
        >
          <SeverityBadge severity={event.severity} compact />
          <span className="font-mono text-[10px] font-medium text-accent">
            {event.id}
          </span>
        </button>
      ))}
    </div>
  );
}

const PAGE_SIZES = [5, 10, 25, 50];

export function SmartDataTable<T extends { id: string }>({
  rows,
  columns,
  filters = [],
  searchPlaceholder = "Search…",
  searchFn,
  filterFn,
  empty = "No results found.",
  pageSize: initialPageSize = 10,
  onRowClick,
  activeId,
  toolbarLabel,
  selectable = false,
  selectedIds,
  onSelectedIdsChange,
  selectionActions,
}: {
  rows: T[];
  columns: TableColumn<T>[];
  filters?: TableFilter[];
  searchPlaceholder?: string;
  searchFn: (row: T, query: string) => boolean;
  filterFn?: (row: T, selected: Record<string, string>) => boolean;
  empty?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  activeId?: string | null;
  toolbarLabel?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  selectionActions?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>(
    () => Object.fromEntries(filters.map((f) => [f.id, "all"])),
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const selected = useMemo(
    () => new Set(selectedIds ?? []),
    [selectedIds],
  );

  useEffect(() => {
    setPage(1);
  }, [query, selectedFilters, pageSize, rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (q && !searchFn(row, q)) return false;
      if (filterFn && !filterFn(row, selectedFilters)) return false;
      return true;
    });
  }, [rows, query, selectedFilters, searchFn, filterFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const showingFrom = filtered.length === 0 ? 0 : start + 1;
  const showingTo = Math.min(start + pageSize, filtered.length);

  const activeFilterCount = Object.values(selectedFilters).filter(
    (v) => v !== "all",
  ).length;

  const clearFilters = () => {
    setQuery("");
    setSelectedFilters(Object.fromEntries(filters.map((f) => [f.id, "all"])));
  };

  const pageSelectedCount = pageRows.filter((row) => selected.has(row.id)).length;
  const allPageSelected =
    pageRows.length > 0 && pageSelectedCount === pageRows.length;

  const toggleRow = (id: string) => {
    if (!onSelectedIdsChange) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedIdsChange(Array.from(next));
  };

  const togglePage = () => {
    if (!onSelectedIdsChange) return;
    const next = new Set(selected);
    if (allPageSelected) {
      for (const row of pageRows) next.delete(row.id);
    } else {
      for (const row of pageRows) next.add(row.id);
    }
    onSelectedIdsChange(Array.from(next));
  };

  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div className="dashboard-card overflow-hidden animate-fade-up">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {toolbarLabel ? (
              <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                {toolbarLabel}
              </p>
            ) : null}
            <p className="text-sm text-muted">
              <span className="font-semibold tabular-nums text-ink">
                {filtered.length}
              </span>{" "}
              {filtered.length === 1 ? "result" : "results"}
              {activeFilterCount > 0 || query ? (
                <span className="text-muted">
                  {" "}
                  · filtered from {rows.length}
                </span>
              ) : null}
              {selectable && selected.size > 0 ? (
                <span className="text-muted">
                  {" "}
                  ·{" "}
                  <span className="font-semibold tabular-nums text-ink">
                    {selected.size}
                  </span>{" "}
                  selected
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectable && selected.size > 0 ? selectionActions : null}
            {(query || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-accent hover:underline"
              >
                Clear search & filters
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search</span>
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5 13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-border bg-surface-muted/40 py-2.5 pr-3 pl-10 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <label key={filter.id} className="flex items-center gap-2">
                <span className="sr-only">{filter.label}</span>
                <select
                  value={selectedFilters[filter.id] ?? "all"}
                  onChange={(e) =>
                    setSelectedFilters((prev) => ({
                      ...prev,
                      [filter.id]: e.target.value,
                    }))
                  }
                  className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="all">{filter.label}: All</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-muted/60 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
            <tr>
              {selectable ? (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate =
                          pageSelectedCount > 0 && !allPageSelected;
                      }
                    }}
                    onChange={togglePage}
                    aria-label="Select page rows"
                  />
                </th>
              ) : null}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`px-4 py-3 font-medium whitespace-nowrap ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-4 py-12 text-center text-sm text-muted"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const isSelected = selected.has(row.id);
                return (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`border-t border-border/70 transition ${
                      onRowClick ? "cursor-pointer hover:bg-accent-soft/40" : ""
                    } ${
                      activeId === row.id || isSelected
                        ? "bg-accent-soft/50"
                        : ""
                    }`}
                  >
                    {selectable ? (
                      <td
                        className="w-10 px-4 py-3 align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(row.id)}
                          aria-label={`Select ${row.id}`}
                        />
                      </td>
                    ) : null}
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={`px-4 py-3 align-middle ${column.className ?? ""}`}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <span>
            Showing{" "}
            <span className="font-medium tabular-nums text-ink">
              {showingFrom}–{showingTo}
            </span>{" "}
            of{" "}
            <span className="font-medium tabular-nums text-ink">
              {filtered.length}
            </span>
          </span>
          <label className="inline-flex items-center gap-2">
            <span className="text-xs tracking-wide uppercase">Rows</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-1">
          <PaginationButton
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            label="Previous"
          />
          <PageNumbers
            page={safePage}
            totalPages={totalPages}
            onChange={setPage}
          />
          <PaginationButton
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            label="Next"
          />
        </div>
      </div>
    </div>
  );
}

function PaginationButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function PageNumbers({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const set = new Set([1, totalPages, page, page - 1, page + 1].filter(
      (n) => n >= 1 && n <= totalPages,
    ));
    return Array.from(set).sort((a, b) => a - b);
  }, [page, totalPages]);

  return (
    <div className="flex items-center gap-1">
      {pages.map((n, index) => {
        const prev = pages[index - 1];
        const showEllipsis = prev != null && n - prev > 1;
        return (
          <span key={n} className="flex items-center gap-1">
            {showEllipsis ? (
              <span className="px-1 text-muted">…</span>
            ) : null}
            <button
              type="button"
              onClick={() => onChange(n)}
              className={`min-w-9 rounded-lg px-2.5 py-1.5 text-sm font-medium tabular-nums transition ${
                n === page
                  ? "bg-ink text-white"
                  : "border border-border bg-surface text-ink hover:border-accent hover:text-accent"
              }`}
            >
              {n}
            </button>
          </span>
        );
      })}
    </div>
  );
}
