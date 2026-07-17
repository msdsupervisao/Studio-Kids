import type { LucideIcon } from "lucide-react";
import { formatCompactNumber } from "@/utils/format";

export interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
}

export function StatsCards({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-border p-4">
          <item.icon className="mb-2 h-5 w-5 text-primary" />
          <p className="text-2xl font-semibold tracking-tight">{formatCompactNumber(item.value)}</p>
          <p className="text-xs text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
