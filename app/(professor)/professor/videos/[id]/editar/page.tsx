import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVideoForEdit, listCategories } from "@/features/video/actions/video.actions";
import { EditVideoForm } from "@/features/video/components/EditVideoForm";

export const metadata: Metadata = { title: "Editar video" };

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideoForEdit(id);
  if (!video) notFound();

  const categories = await listCategories();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Editar video</h1>
      <EditVideoForm video={video} categories={categories} />
    </div>
  );
}
