import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  CLOUDINARY_URL: z.string().optional(),
  FRONTEND_URL: z.string().url().optional(),
  PORT: z.string().optional(),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.warn("Invalid environment variables:", parsed.error.format());
}

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  cloudinaryUrl: process.env.CLOUDINARY_URL,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "",
  nodeEnv: (process.env.NODE_ENV || "development") as "development" | "production" | "test",
};

export type Env = typeof env;
