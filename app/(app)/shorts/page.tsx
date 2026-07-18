import type { Metadata } from "next";
import { Zap } from "lucide-react";
import { listShortsFeed } from "@/features/shorts/actions/shorts.actions";
import { ShortsFeed } from "@/features/shorts/components/ShortsFeed";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Shorts" };

export default async function ShortsPage() {
  const items = await listShortsFeed();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Zap}
        title="Nenhum short publicado ainda"
        description="Shorts enviados por professores aparecem aqui."
      />
    );
  }

  return <ShortsFeed items={items} />;
}
