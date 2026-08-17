"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/features/video/components/ShareDialog";
import { ROUTES } from "@/lib/constants";

export function ShareButton({ videoId, title }: { videoId: string; title: string }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}${ROUTES.video(videoId)}` : ROUTES.video(videoId);

  return (
    <ShareDialog
      url={url}
      title={title}
      trigger={
        <Button variant="secondary" className="gap-2">
          <Share2 className="h-4 w-4" /> Compartilhar
        </Button>
      }
    />
  );
}
