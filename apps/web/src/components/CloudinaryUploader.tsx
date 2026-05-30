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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no puede superar los 5MB");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Solo se permiten JPG, PNG y WebP");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await res.json();
      if (data.secure_url) {
        onChange([...images, data.secure_url]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border">
            <img src={url} alt="" className="h-full w-full object-cover" />
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
          <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition hover:border-foreground/30 hover:text-foreground">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
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
