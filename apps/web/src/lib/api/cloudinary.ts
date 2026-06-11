import { v2 as cloudinary } from "cloudinary";

// CLOUDINARY_URL env var is auto-detected by the SDK.
// If not set, we provide a fallback using individual env vars.
if (!process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export { cloudinary };
