"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { BarChart3, ChevronDown, Clock, FileQuestion, ImageIcon, Images, Send, Video as VideoIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createChannelPost } from "@/features/canal/actions/channel-post.actions";
import type { ChannelPostKind } from "@/types/database.types";
import type { VideoCardData } from "@/types/video.types";

const KIND_OPTIONS: Array<{ kind: ChannelPostKind; label: string; icon: typeof ImageIcon }> = [
  { kind: "image", label: "Imagem", icon: ImageIcon },
  { kind: "image_poll", label: "Sondagem de imagem", icon: Images },
  { kind: "poll", label: "Sondagem de texto", icon: BarChart3 },
  { kind: "video", label: "Vídeo", icon: VideoIcon },
  { kind: "quiz", label: "Questionário", icon: FileQuestion },
];

type ImageSlot = { file: File | null; preview: string | null; caption: string };

function emptySlot(): ImageSlot {
  return { file: null, preview: null, caption: "" };
}

export function ChannelPostComposer({
  channelId,
  channelName,
  videos,
}: {
  channelId: string;
  channelName: string;
  videos: VideoCardData[];
}) {
  const [kind, setKind] = useState<ChannelPostKind>("text");
  const [content, setContent] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [image, setImage] = useState<ImageSlot>(emptySlot());
  const [pollImages, setPollImages] = useState<ImageSlot[]>([emptySlot(), emptySlot()]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isPending, startTransition] = useTransition();
  const imageInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setKind("text");
    setContent("");
    setOptions(["", ""]);
    setImage(emptySlot());
    setPollImages([emptySlot(), emptySlot()]);
    setSelectedVideoId(null);
    setScheduleOpen(false);
    setScheduledAt("");
  }

  function toggleKind(next: ChannelPostKind) {
    setKind((current) => (current === next ? "text" : next));
  }

  function publish() {
    if (kind === "poll" || kind === "quiz") {
      if (options.filter((option) => option.trim()).length < 2) {
        toast.error("Adicione ao menos 2 opções");
        return;
      }
    }
    if (kind === "image" && !image.file) {
      toast.error("Selecione uma imagem");
      return;
    }
    if (kind === "image_poll" && pollImages.filter((slot) => slot.file).length < 2) {
      toast.error("Adicione ao menos 2 imagens");
      return;
    }
    if (kind === "video" && !selectedVideoId) {
      toast.error("Selecione um vídeo do canal");
      return;
    }
    if (kind === "text" && !content.trim()) {
      toast.error("Escreva uma mensagem para publicar");
      return;
    }

    const formData = new FormData();
    formData.set("channelId", channelId);
    formData.set("kind", kind);
    formData.set("content", content);
    if (kind === "poll" || kind === "quiz") {
      options.forEach((option) => option.trim() && formData.append("option", option.trim()));
    }
    if (kind === "image" && image.file) formData.set("image", image.file);
    if (kind === "image_poll") {
      pollImages.forEach((slot) => {
        if (slot.file) {
          formData.append("optionImage", slot.file);
          formData.append("option", slot.caption.trim());
        }
      });
    }
    if (kind === "video" && selectedVideoId) formData.set("videoId", selectedVideoId);
    if (scheduleOpen && scheduledAt) formData.set("scheduledAt", new Date(scheduledAt).toISOString());

    startTransition(async () => {
      try {
        await createChannelPost(formData);
        reset();
        toast.success(scheduleOpen && scheduledAt ? "Publicação agendada" : "Publicado na comunidade do canal");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível publicar");
      }
    });
  }

  return (
    <section className="max-w-2xl rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3">
        <p className="text-sm font-semibold">Publicar na comunidade</p>
        <p className="text-xs text-muted-foreground">Compartilhe uma novidade com quem acompanha {channelName}.</p>
      </div>

      <Textarea
        value={content}
        maxLength={2000}
        onChange={(event) => setContent(event.target.value)}
        placeholder={kind === "text" ? "Partilhe uma novidade dos bastidores..." : "Escreva uma legenda (opcional)..."}
      />

      {kind === "image" && (
        <div className="mt-3">
          {image.preview ? (
            <div className="relative">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
                <Image src={image.preview} alt="" fill className="object-cover" />
              </div>
              <button
                type="button"
                aria-label="Remover imagem"
                className="focus-ring absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white"
                onClick={() => setImage(emptySlot())}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="focus-ring flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground hover:bg-secondary/40">
              <ImageIcon className="h-4 w-4" /> Selecionar imagem
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setImage(file ? { file, preview: URL.createObjectURL(file), caption: "" } : emptySlot());
                }}
              />
            </label>
          )}
        </div>
      )}

      {kind === "image_poll" && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {pollImages.map((slot, index) => (
            <div key={index} className="space-y-2">
              {slot.preview ? (
                <div className="relative">
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
                    <Image src={slot.preview} alt="" fill className="object-cover" />
                  </div>
                  <button
                    type="button"
                    aria-label="Remover imagem"
                    className="focus-ring absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white"
                    onClick={() =>
                      setPollImages((current) => current.map((item, i) => (i === index ? emptySlot() : item)))
                    }
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="focus-ring flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:bg-secondary/40">
                  <Images className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setPollImages((current) =>
                        current.map((item, i) =>
                          i === index ? { file, preview: file ? URL.createObjectURL(file) : null, caption: item.caption } : item
                        )
                      );
                    }}
                  />
                </label>
              )}
              <Input
                value={slot.caption}
                maxLength={120}
                placeholder={`Legenda ${index + 1} (opcional)`}
                onChange={(event) =>
                  setPollImages((current) =>
                    current.map((item, i) => (i === index ? { ...item, caption: event.target.value } : item))
                  )
                }
              />
            </div>
          ))}
          {pollImages.length < 4 && (
            <button
              type="button"
              className="focus-ring col-span-2 text-xs font-medium text-primary hover:underline"
              onClick={() => setPollImages((current) => [...current, emptySlot()])}
            >
              Adicionar imagem
            </button>
          )}
        </div>
      )}

      {(kind === "poll" || kind === "quiz") && (
        <div className="mt-3 space-y-2">
          {options.map((option, index) => (
            <Input
              key={index}
              value={option}
              maxLength={120}
              placeholder={`Opção ${index + 1}`}
              onChange={(event) =>
                setOptions((current) => current.map((value, i) => (i === index ? event.target.value : value)))
              }
            />
          ))}
          {options.length < 4 && (
            <button
              type="button"
              className="focus-ring text-xs font-medium text-primary hover:underline"
              onClick={() => setOptions((current) => [...current, ""])}
            >
              Adicionar opção
            </button>
          )}
        </div>
      )}

      {kind === "video" && (
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {videos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Você ainda não tem vídeos publicados para compartilhar.</p>
          ) : (
            videos.map((video) => (
              <button
                key={video.id}
                type="button"
                onClick={() => setSelectedVideoId(video.id)}
                className={`focus-ring flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors ${
                  selectedVideoId === video.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
                }`}
              >
                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {video.thumbnailUrl && <Image src={video.thumbnailUrl} alt="" fill className="object-cover" />}
                </div>
                <span className="line-clamp-2 text-sm">{video.title}</span>
              </button>
            ))
          )}
        </div>
      )}

      <div className="mb-3 mt-4 flex flex-wrap gap-2">
        {KIND_OPTIONS.map(({ kind: optionKind, label, icon: Icon }) => (
          <Button
            key={optionKind}
            type="button"
            variant={kind === optionKind ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => toggleKind(optionKind)}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </Button>
        ))}
      </div>

      {scheduleOpen && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-border p-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <input
            type="datetime-local"
            value={scheduledAt}
            min={new Date().toISOString().slice(0, 16)}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="focus-ring flex-1 rounded-md border border-border bg-transparent px-2 py-1 text-sm"
          />
          <button
            type="button"
            className="focus-ring text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setScheduleOpen(false);
              setScheduledAt("");
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <div className="inline-flex overflow-hidden rounded-lg">
          <Button type="button" onClick={publish} disabled={isPending} className="gap-2 rounded-r-none">
            <Send className="h-4 w-4" />
            {isPending ? "Publicando..." : scheduleOpen && scheduledAt ? "Agendar" : "Publicar"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" disabled={isPending} className="rounded-l-none border-l border-primary-foreground/20 px-2">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setScheduleOpen(false)}>Publicar agora</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setScheduleOpen(true)}>Agendar para depois</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </section>
  );
}
