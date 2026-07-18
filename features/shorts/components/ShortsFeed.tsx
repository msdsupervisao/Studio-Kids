"use client";

import { ShortPlayer } from "@/features/shorts/components/ShortPlayer";
import type { ShortFeedItem } from "@/features/shorts/actions/shorts.actions";

export function ShortsFeed({ items }: { items: ShortFeedItem[] }) {
  return (
    <div className="h-[calc(100vh-4rem)] snap-y snap-mandatory overflow-y-auto scroll-smooth">
      {items.map((item) => (
        <ShortPlayer key={item.id} item={item} />
      ))}
    </div>
  );
}
