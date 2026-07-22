import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { listCategories, listPublishedVideos } from "@/features/video/actions/video.actions";
import { VideoCard } from "@/components/shared/VideoCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { CategoryFilterBar } from "@/components/shared/CategoryFilterBar";
import { ROUTES } from "@/lib/constants";

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
      <CategoryFilterBar categories={categories} activeSlug={categoria} basePath={ROUTES.explore} />

      {videos.length === 0 ? (
        <EmptyState icon={Compass} title="Nenhum vídeo nessa categoria ainda" />
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
