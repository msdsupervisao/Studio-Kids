import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { getMyChannels } from "@/features/canal/actions/channel.actions";
import { listVideosByChannel } from "@/features/video/actions/video.actions";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import type { VideoStatus } from "@/types/video.types";

export const metadata: Metadata = { title: "Status de aprovacao" };

const STATUS_LABEL: Record<VideoStatus, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  published: { label: "Aprovado", variant: "success" },
  pending: { label: "Aguardando analise", variant: "secondary" },
  draft: { label: "Rascunho", variant: "secondary" },
  rejected: { label: "Rejeitado", variant: "destructive" },
};

export default async function ProfessorApprovalsPage() {
  const channels = await getMyChannels();
  const videosByChannel = await Promise.all(channels.map((channel) => listVideosByChannel(channel.id)));
  const videos = videosByChannel.flat().filter((video) => video.status !== "published");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Status de aprovacao</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe aqui a analise dos videos que ainda nao estao publicos.
        </p>
      </div>

      {videos.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Nada pendente" description="Todos os seus videos ja foram avaliados." />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {videos.map((video) => (
            <li key={video.id} className="flex items-center justify-between gap-4 p-4">
              <p className="text-sm font-medium">{video.title}</p>
              <Badge variant={STATUS_LABEL[video.status].variant}>{STATUS_LABEL[video.status].label}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
