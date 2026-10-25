import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { trendClass } from "@/lib/portfolio";

export function trendText(value: number) {
  const t = trendClass(value);
  return t === "up" ? "text-up" : t === "down" ? "text-down" : "text-muted-foreground";
}

export function trendBg(value: number) {
  const t = trendClass(value);
  return t === "up"
    ? "bg-up-soft text-up"
    : t === "down"
      ? "bg-down-soft text-down"
      : "bg-muted text-muted-foreground";
}

export function TrendIcon({ value, className }: { value: number; className?: string }) {
  const t = trendClass(value);
  const Icon = t === "up" ? ArrowUpRight : t === "down" ? ArrowDownRight : Minus;
  return <Icon className={cn("size-4 shrink-0", className)} aria-hidden />;
}

export function TrendPill({ value, children }: { value: number; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium",
        trendBg(value),
      )}
    >
      <TrendIcon value={value} className="size-3.5" />
      {children}
    </span>
  );
}
