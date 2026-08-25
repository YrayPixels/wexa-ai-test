import type { Severity } from "@/lib/types";

const styles: Record<Severity, string> = {
  Critical: "bg-critical-soft text-critical",
  Medium: "bg-medium-soft text-medium",
  Low: "bg-low-soft text-low",
};

const darkStyles: Record<Severity, string> = {
  Critical: "bg-critical/25 text-[#ff8fa3]",
  Medium: "bg-medium/25 text-[#fbbf24]",
  Low: "bg-low/25 text-[#93c5fd]",
};

export function SeverityBadge({
  severity,
  compact = false,
  dark = false,
}: {
  severity: Severity;
  compact?: boolean;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center font-mono font-medium tracking-wide uppercase ${
        dark ? darkStyles[severity] : styles[severity]
      } ${compact ? "rounded-md px-1.5 py-0.5 text-[9px]" : "rounded-full px-2.5 py-0.5 text-[11px]"}`}
    >
      {severity}
    </span>
  );
}
