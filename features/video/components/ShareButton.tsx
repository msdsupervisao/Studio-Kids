"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/constants";

export function ShareButton({ videoId }: { videoId: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}${ROUTES.video(videoId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponivel (permissao negada); sem feedback de erro por ser baixo risco.
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Share2 className="h-4 w-4" /> Compartilhar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-3">
        <DropdownMenuLabel className="px-0">Link do vídeo</DropdownMenuLabel>
        <div className="mt-1 flex items-center gap-2">
          <input
            readOnly
            value={typeof window !== "undefined" ? `${window.location.origin}${ROUTES.video(videoId)}` : ""}
            onFocus={(event) => event.currentTarget.select()}
            className="focus-ring h-9 flex-1 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
          />
          <Button type="button" size="icon" variant="secondary" onClick={copyLink} aria-label="Copiar link">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
