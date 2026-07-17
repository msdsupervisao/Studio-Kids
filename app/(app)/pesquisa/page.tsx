import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { searchVideos } from "@/features/video/actions/video.actions";
import { VideoCard } from "@/components/shared/VideoCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Pesquisa" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const videos = query ? await searchVideos(query) : [];

  if (!query) {
    return <EmptyState icon={SearchX} title="Digite algo na busca para comecar" />;
  }

  if (videos.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={`Nenhum resultado para "${query}"`}
        description="Tente outras palavras-chave."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {videos.length} resultado{videos.length === 1 ? "" : "s"} para &ldquo;{query}&rdquo;
      </p>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
