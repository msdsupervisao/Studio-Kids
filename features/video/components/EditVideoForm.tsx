"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/services/supabase/client";
import { createStorageService } from "@/services/storage/storage.service";
import { updateVideo, updateVideoThumbnail, type VideoForEdit } from "@/features/video/actions/video.actions";
import { STORAGE_BUCKETS, ROUTES } from "@/lib/constants";
import type { Database } from "@/types/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export function EditVideoForm({ video, categories }: { video: VideoForEdit; categories: Category[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  const [categoryId, setCategoryId] = useState(video.categoryId ?? "");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(video.thumbnailUrl);
  const [isPending, startTransition] = useTransition();

  function handleThumbnailChange(file: File | null) {
    setThumbnailFile(file);
    setThumbnailPreview(file ? URL.createObjectURL(file) : video.thumbnailUrl);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        await updateVideo(video.id, { title, description, categoryId: categoryId || null });

        if (thumbnailFile) {
          const supabase = createClient();
          const storage = createStorageService(supabase);
          const extension = thumbnailFile.name.split(".").pop() ?? "jpg";
          const path = `${video.channelId}/${video.id}.${extension}`;
          await storage.upload(STORAGE_BUCKETS.thumbnails, path, thumbnailFile);
          await updateVideoThumbnail(video.id, path);
        }

        toast.success("Video atualizado");
        router.push(ROUTES.professorVideos);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao salvar alteracoes");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="title">Titulo</Label>
        <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={150} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descricao</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
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
        <Label htmlFor="thumbnail">Miniatura</Label>
        {thumbnailPreview && (
          // eslint-disable-next-line @next/next/no-img-element -- preview pode ser uma blob: URL local, fora do escopo do otimizador de imagem do Next.
          <img
            src={thumbnailPreview}
            alt="Miniatura atual"
            className="aspect-video w-full max-w-xs rounded-xl border border-border object-cover"
          />
        )}
        <Input
          id="thumbnail"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => handleThumbnailChange(event.target.files?.[0] ?? null)}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Salvando..." : "Salvar alteracoes"}
      </Button>
    </form>
  );
}
