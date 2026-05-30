import { v2 as cloudinary } from "cloudinary";

// Config reads CLOUDINARY_URL env var automatically
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dkwd8oqdh",
});

export async function ensureUploadPreset() {
  try {
    const result = await cloudinary.api.create_upload_preset({
      name: "comesana_preset",
      unsigned: true,
      folder: "comesana-propiedades",
      allowed_formats: "jpg,png,webp",
      max_file_size: 5000000,
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });
    console.log("✅ Cloudinary preset created:", result.name);
    return result.name;
  } catch (error: any) {
    if (error?.error?.message?.includes("already exists")) {
      console.log("ℹ️ Cloudinary preset already exists");
      return "comesana_preset";
    }
    console.error("❌ Failed to create Cloudinary preset:", error?.error?.message || error);
    return "comesana_preset";
  }
}

export { cloudinary };
