"use client";

import type { DashboardSection } from "@/lib/types";

const catalogItems: Array<{
  id: Exclude<DashboardSection, "events">;
  label: string;
  hint: string;
}> = [
  { id: "batches", label: "Batches", hint: "Material batches" },
  { id: "products", label: "Products", hint: "Finished goods" },
  { id: "shipments", label: "Shipments", hint: "Outbound logistics" },
  { id: "customers", label: "Customers", hint: "Order recipients" },
];

function NavIcon({ id }: { id: DashboardSection }) {
  const common = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none" as const };
  switch (id) {
    case "events":
      return (
        <svg {...common} aria-hidden>
          <path
            d="M8 2.5v11M3.5 6.5 8 2.5l4.5 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "batches":
      return (
        <svg {...common} aria-hidden>
          <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 7h10M7 3v10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "products":
      return (
        <svg {...common} aria-hidden>
          <path
            d="M3 5.5 8 3l5 2.5v5L8 13l-5-2.5v-5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "shipments":
      return (
        <svg {...common} aria-hidden>
          <path
            d="M2.5 10.5h8.5V5H6L4.5 7H2.5v3.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="5" cy="12" r="1.2" fill="currentColor" />
          <circle cx="10" cy="12" r="1.2" fill="currentColor" />
        </svg>
      );
    case "customers":
      return (
        <svg {...common} aria-hidden>
          <circle cx="8" cy="5.5" r="2.2" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M3.5 13c.8-2.2 2.3-3.3 4.5-3.3S11.7 10.8 12.5 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

export function DashboardSidebar({
  section,
  onSelectSection,
  open,
  onClose,
}: {
  section: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col bg-sidebar text-white transition-transform duration-300 md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-5 pt-6 pb-5">
          <button
            type="button"
            className="flex items-center gap-3"
            onClick={() => {
              onSelectSection("events");
              onClose();
            }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white shadow-[0_0_0_4px_rgba(255,106,0,0.2)]">
              T
            </span>
            <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
              TRACE
            </span>
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 pb-5">
          <div>
            <p className="px-2 font-mono text-[10px] tracking-[0.18em] text-sidebar-muted uppercase">
              Catalog
            </p>
            <div className="mt-2 space-y-1">
              {catalogItems.map((item) => {
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectSection(item.id);
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? "bg-accent text-white"
                        : "text-white/85 hover:bg-sidebar-hover"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        active ? "bg-white/15 text-white" : "bg-white/5 text-accent"
                      }`}
                    >
                      <NavIcon id={item.id} />
                    </span>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p
                        className={`text-[11px] font-normal ${
                          active ? "text-white/80" : "text-sidebar-muted"
                        }`}
                      >
                        {item.hint}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="px-2 font-mono text-[10px] tracking-[0.18em] text-sidebar-muted uppercase">
              Focus
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectSection("events");
                onClose();
              }}
              className={`mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                section === "events"
                  ? "bg-accent text-white"
                  : "text-white/85 hover:bg-sidebar-hover"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  section === "events" ? "bg-white/15 text-white" : "bg-white/5 text-accent"
                }`}
              >
                <NavIcon id="events" />
              </span>
              <div>
                <p className="font-medium">Events</p>
                <p
                  className={`text-[11px] font-normal ${
                    section === "events" ? "text-white/80" : "text-sidebar-muted"
                  }`}
                >
                  Quality investigations
                </p>
              </div>
            </button>
          </div>
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-xs leading-relaxed text-sidebar-muted">
            Browse the catalog, then open an event or affected batch to see blast radius.
          </p>
        </div>
      </aside>
    </>
  );
}
