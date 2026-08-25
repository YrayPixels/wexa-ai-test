import type { Severity } from "@/lib/types";

const styles: Record<Severity, string> = {
  Critical: "bg-critical-soft text-critical",
  Medium: "bg-medium-soft text-medium",
  Low: "bg-low-soft text-low",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[11px] font-medium tracking-wide uppercase ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}
