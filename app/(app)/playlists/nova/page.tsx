import type { Metadata } from "next";
import { PlaylistForm } from "@/features/playlist/components/PlaylistForm";

export const metadata: Metadata = { title: "Nova playlist" };

export default function NewPlaylistPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Nova playlist</h1>
      <PlaylistForm />
    </div>
  );
}
