"use client";

import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
}

export function CloudinaryUploader({ images, onChange, max = 10 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  return (
    <div className="space-y-2">
      {errorMsg && (
        <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--admin-destructive)", color: "#fff" }}>
          {errorMsg}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg" style={{ border: "1px solid var(--admin-border)" }}>
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
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
