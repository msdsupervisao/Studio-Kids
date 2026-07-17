import { formatCompactNumber } from "@/utils/format";

export interface StatsChartItem {
  label: string;
  value: number;
}

export function StatsCharts({ title, items }: { title: string; items: StatsChartItem[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="line-clamp-1 text-foreground">{item.label}</span>
              <span className="shrink-0 text-muted-foreground">{formatCompactNumber(item.value)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
