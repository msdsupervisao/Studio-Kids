"use client";

import { ShortPlayer } from "@/features/shorts/components/ShortPlayer";
import type { ShortFeedItem } from "@/features/shorts/actions/shorts.actions";
import type { CurrentUser } from "@/types/user.types";

export function ShortsFeed({ items, initialUser }: { items: ShortFeedItem[]; initialUser: CurrentUser | null }) {
  return (
    <div className="h-[calc(100vh-4rem)] snap-y snap-mandatory overflow-y-auto scroll-smooth">
      {items.map((item) => (
        <ShortPlayer key={item.id} item={item} initialUser={initialUser} />
      ))}
    </div>
  );
}
