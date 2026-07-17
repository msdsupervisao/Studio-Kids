"use client";

import { useRef, useState } from "react";
import { FileVideo, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UPLOAD_LIMITS } from "@/lib/constants";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VideoUploadDropzone({
  onFileSelected,
  onDurationDetected,
}: {
  onFileSelected: (file: File | null) => void;
  onDurationDetected: (seconds: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(candidate: File | undefined | null) {
    setError(null);
    if (!candidate) return;

    if (!(UPLOAD_LIMITS.allowedVideoTypes as readonly string[]).includes(candidate.type)) {
      setError("Formato nao suportado. Use MP4, WebM ou MOV.");
      return;
    }
    if (candidate.size > UPLOAD_LIMITS.maxVideoSizeBytes) {
      setError("O video excede o limite de 2GB.");
      return;
    }

    setFile(candidate);
    onFileSelected(candidate);

    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    videoEl.onloadedmetadata = () => {
      onDurationDetected(Math.round(videoEl.duration));
      URL.revokeObjectURL(videoEl.src);
    };
    videoEl.src = URL.createObjectURL(candidate);
  }

  function clear() {
    setFile(null);
    onFileSelected(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (file) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border p-4">
        <div className="flex items-center gap-3">
          <FileVideo className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
        </div>
        <button type="button" onClick={clear} className="focus-ring rounded-md p-1.5 hover:bg-secondary" aria-label="Remover video">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files[0]);
        }}
        className={cn(
          "focus-ring flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Arraste o video aqui ou clique para escolher</p>
        <p className="text-xs text-muted-foreground">MP4, WebM ou MOV — ate 2GB</p>
        <input
          ref={inputRef}
          type="file"
          accept={UPLOAD_LIMITS.allowedVideoTypes.join(",")}
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </label>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
