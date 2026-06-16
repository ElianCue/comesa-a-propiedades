"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, GripVertical } from "lucide-react";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
}

export function CloudinaryUploader({ images, onChange, max = 10 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("La imagen no puede superar los 5MB");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Solo se permiten JPG, PNG y WebP");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Error al subir la imagen");
        return;
      }

      if (data.secure_url) {
        onChange([...images, data.secure_url]);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMsg(err?.message || "Error de red al subir la imagen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
    setDragIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIdx(index);
  };

  const handleDrop = (index: number) => {
    const from = dragItem.current;
    if (from === null || from === index) {
      setDragIdx(null);
      setOverIdx(null);
      dragItem.current = null;
      return;
    }
    const reordered = [...images];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);
    onChange(reordered);
    setDragIdx(null);
    setOverIdx(null);
    dragItem.current = null;
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
    dragItem.current = null;
  };

  return (
    <div className="space-y-2">
      {errorMsg && (
        <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--admin-destructive)", color: "#fff" }}>
          {errorMsg}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div
            key={url}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
            className="group relative h-20 w-20 overflow-hidden rounded-lg cursor-grab active:cursor-grabbing transition-shadow"
            style={{
              border: overIdx === i && dragIdx !== i
                ? "2px dashed var(--gold)"
                : "1px solid var(--admin-border)",
              opacity: dragIdx === i ? 0.4 : 1,
              boxShadow: overIdx === i && dragIdx !== i
                ? "0 0 0 2px rgba(212,175,55,0.3)"
                : "none",
            }}
          >
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover pointer-events-none"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-black/40 text-white/70 opacity-0 transition group-hover:opacity-100 pointer-events-none">
              <GripVertical className="h-3 w-3" />
            </div>
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition" style={{ borderColor: "var(--admin-input-border)" }}>
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--gold)" }} />
            ) : (
              <Upload className="h-5 w-5" style={{ color: "var(--admin-text-muted)" }} />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  );
}
