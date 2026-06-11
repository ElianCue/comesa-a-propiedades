import { v2 as cloudinary } from "cloudinary";

function parseCloudinaryUrl(url: string) {
  const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (match) {
    return { api_key: match[1], api_secret: match[2], cloud_name: match[3] };
  }
  return null;
}

const urlConfig = process.env.CLOUDINARY_URL
  ? parseCloudinaryUrl(process.env.CLOUDINARY_URL)
  : null;

cloudinary.config({
  cloud_name: urlConfig?.cloud_name || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: urlConfig?.api_key || process.env.CLOUDINARY_API_KEY,
  api_secret: urlConfig?.api_secret || process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
