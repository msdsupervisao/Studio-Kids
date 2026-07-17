import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { listCategories, listPublishedVideos } from "@/features/video/actions/video.actions";
import { VideoCard } from "@/components/shared/VideoCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Explorar" };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const [categories, videos] = await Promise.all([
    listCategories(),
    listPublishedVideos({ limit: 32, categorySlug: categoria }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link
          href={ROUTES.explore}
          className={cn(
            "focus-ring shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            !categoria ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"
          )}
        >
          Todas
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`${ROUTES.explore}?categoria=${category.slug}`}
            className={cn(
              "focus-ring shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              categoria === category.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-secondary"
            )}
          >
            {category.name}
          </Link>
        ))}
      </div>

      {videos.length === 0 ? (
        <EmptyState icon={Compass} title="Nenhum video nessa categoria ainda" />
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
