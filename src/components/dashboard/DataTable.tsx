"use client";

import type { ReactNode } from "react";
import { SeverityBadge } from "@/components/SeverityBadge";
import type { LinkedEventRef } from "@/lib/types";

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
          <span className="font-mono text-[10px] font-medium text-accent">{event.id}</span>
        </button>
      ))}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: ReactNode[];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="dashboard-card px-6 py-12 text-center text-sm text-muted">
        {empty}
      </div>
    );
  }

  return (
    <div className="dashboard-card overflow-hidden animate-fade-up">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-muted/60 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-medium whitespace-nowrap">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </div>
  );
}

export function TableRowButton({
  children,
  onClick,
  active = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <tr
      onClick={onClick}
      className={`border-t border-border/70 transition ${
        onClick ? "cursor-pointer hover:bg-accent-soft/40" : ""
      } ${active ? "bg-accent-soft/50" : ""}`}
    >
      {children}
    </tr>
  );
}
