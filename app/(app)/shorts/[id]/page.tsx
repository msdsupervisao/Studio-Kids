import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listShortsFeed } from "@/features/shorts/actions/shorts.actions";
import { ShortsFeed } from "@/features/shorts/components/ShortsFeed";
import { getCurrentUser } from "@/features/auth/actions/auth.actions";

export const metadata: Metadata = { title: "Shorts" };

export default async function ShortDeepLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [items, initialUser] = await Promise.all([listShortsFeed(), getCurrentUser()]);
  if (items.length === 0) notFound();

  const target = items.find((item) => item.id === id);
  const ordered = target ? [target, ...items.filter((item) => item.id !== id)] : items;

  return <ShortsFeed items={ordered} initialUser={initialUser} />;
}
