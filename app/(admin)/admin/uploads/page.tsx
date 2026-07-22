import type { Metadata } from "next";
import { CheckSquare } from "lucide-react";
import { listPendingVideos } from "@/features/video/actions/video.actions";
import { VideoApprovalActions } from "@/features/video/components/VideoApprovalActions";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDuration, formatRelativeDate } from "@/utils/format";

export const metadata: Metadata = { title: "Moderação de vídeos" };

export default async function AdminUploadsPage() {
  const videos = await listPendingVideos();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Moderação de vídeos</h1>
        <p className="text-sm text-muted-foreground">
          Revise os vídeos enviados por professores antes de ficarem públicos.
        </p>
      </div>

      {videos.length === 0 ? (
        <EmptyState icon={CheckSquare} title="Nada para revisar" description="Todos os vídeos enviados já foram avaliados." />
      ) : (
        <ul className="space-y-3">
          {videos.map((video) => (
            <li key={video.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-medium">{video.title}</p>
                <p className="text-xs text-muted-foreground">
                  {video.channel.name} · {formatDuration(video.durationSeconds)} ·{" "}
                  {video.publishedAt ? formatRelativeDate(video.publishedAt) : "enviado recentemente"}
                </p>
              </div>
              <VideoApprovalActions videoId={video.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
