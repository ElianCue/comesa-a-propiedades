import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  RESEND_API_KEY: z.string().optional(),
  ALERT_FROM_EMAIL: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.warn("Invalid environment variables:", parsed.error.format());
}

export const env = {
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  alertFromEmail: process.env.ALERT_FROM_EMAIL || "propiedades@comesana.com",
  cloudinaryUrl: process.env.CLOUDINARY_URL || "",
  cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dkwd8oqdh",
  nodeEnv: (process.env.NODE_ENV || "development") as "development" | "production" | "test",
};

export type Env = typeof env;
