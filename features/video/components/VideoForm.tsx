"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VideoUploadDropzone } from "@/features/video/components/VideoUploadDropzone";
import { AIGenerateButton } from "@/features/ia/components/AIGenerateButton";
import { useUpload } from "@/hooks/use-upload";
import { cn } from "@/lib/utils";
import type { Channel } from "@/types/channel.types";
import type { Database } from "@/types/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

const SHORT_MAX_SECONDS = 60;

export function VideoForm({ channels, categories }: { channels: Channel[]; categories: Category[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [channelId, setChannelId] = useState<string>(channels[0]?.id ?? "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [isShort, setIsShort] = useState(false);
  const { submit, isSubmitting } = useUpload();

  const shortTooLong = isShort && duration > SHORT_MAX_SECONDS;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!videoFile || !channelId || shortTooLong) return;

    await submit({
      channelId,
      title,
      description,
      categoryId: categoryId || null,
      videoFile,
      thumbnailFile,
      durationSeconds: duration,
      isShort,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <VideoUploadDropzone onFileSelected={setVideoFile} onDurationDetected={setDuration} />

      <div className="space-y-1.5">
        <Label>Tipo de video</Label>
        <div className="inline-flex rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => setIsShort(false)}
            className={cn(
              "focus-ring rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              !isShort ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Video normal
          </button>
          <button
            type="button"
            onClick={() => setIsShort(true)}
            className={cn(
              "focus-ring rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isShort ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Short
          </button>
        </div>
        {shortTooLong && (
          <p className="text-sm text-destructive">
            Shorts devem ter ate {SHORT_MAX_SECONDS} segundos — esse video tem {duration}s. Escolha outro arquivo ou
            envie como video normal.
          </p>
        )}
      </div>

      {channels.length > 1 && (
        <div className="space-y-1.5">
          <Label htmlFor="channel">Canal</Label>
          <Select value={channelId} onValueChange={setChannelId}>
            <SelectTrigger id="channel">
              <SelectValue placeholder="Selecione um canal" />
            </SelectTrigger>
            <SelectContent>
              {channels.map((channel) => (
                <SelectItem key={channel.id} value={channel.id}>
                  {channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="title">Titulo</Label>
          <AIGenerateButton
            draftTitle={title}
            draftDescription={description}
            onSuggestion={(suggestion) => {
              setTitle(suggestion.title);
              setDescription(suggestion.description);
            }}
          />
        </div>
        <Input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex: Introducao a Derivadas"
          required
          maxLength={150}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descricao</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="O que o aluno vai aprender nesta aula?"
          className="min-h-32"
          maxLength={5000}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">Categoria</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="thumbnail">Miniatura (opcional)</Label>
        <Input
          id="thumbnail"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setThumbnailFile(event.target.files?.[0] ?? null)}
        />
      </div>

      <Button type="submit" disabled={!videoFile || !channelId || isSubmitting || shortTooLong} className="w-full">
        {isSubmitting ? "Enviando..." : isShort ? "Enviar Short para analise" : "Enviar para analise"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Seu video ficara visivel apos a aprovacao da nossa equipe.
      </p>
    </form>
  );
}
