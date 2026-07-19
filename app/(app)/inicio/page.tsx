import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Compass, Zap } from "lucide-react";
import { listCategories, listPublishedVideos } from "@/features/video/actions/video.actions";
import { listShorts } from "@/features/shorts/actions/shorts.actions";
import { VideoCard } from "@/components/shared/VideoCard";
import { ShortCard } from "@/components/shared/ShortCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { CategoryFilterBar } from "@/components/shared/CategoryFilterBar";
import { PlayfulBackground } from "@/components/shared/PlayfulBackground";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Inicio" };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const [categories, videos, shorts] = await Promise.all([
    listCategories(),
    listPublishedVideos({ limit: 24, categorySlug: categoria }),
    listShorts(10),
  ]);

  return (
    <div className="relative isolate space-y-8">
      <PlayfulBackground />
      <CategoryFilterBar categories={categories} activeSlug={categoria} basePath={ROUTES.home} />

      {shorts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Shorts</h2>
            </div>
            <Link
              href={ROUTES.shorts}
              className="focus-ring flex items-center text-xs font-medium text-primary hover:underline"
            >
              Ver tudo <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {shorts.map((short) => (
              <ShortCard key={short.id} video={short} />
            ))}
          </div>
        </section>
      )}

      {videos.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="Ainda nao ha aulas publicadas"
          description="Assim que professores publicarem videos, eles aparecerao aqui."
        />
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
