import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import serverless from "serverless-http";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";
import { errorHandler } from "./middleware/error-handler";
import { authRoutes } from "./routes/auth.routes";
import { propertyRoutes } from "./routes/property.routes";
import { inquiryRoutes } from "./routes/inquiry.routes";
import { lookupRoutes } from "./routes/lookup.routes";
import { logger } from "./lib/logger";
import { env } from "./lib/env";
import { prisma } from "./lib/prisma";

// Initialize Sentry
const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: env.nodeEnv,
    tracesSampleRate: env.nodeEnv === "production" ? 0.1 : 1.0,
  });
}

const app: Express = express();

// Disable ETag to avoid 304 responses on dynamic content
app.disable("etag");

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP per windowMs
  message: "Demasiadas solicitudes desde esta dirección IP",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: "Demasiados intentos de login. Intenta más tarde.",
});

// Middleware global
app.use(helmet());
app.use(
  cors({ origin: env.frontendUrl || "http://localhost:3000", credentials: true })
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// No-cache headers for API endpoints
app.use("/api", (req, _res, next) => {
  _res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  _res.set("Pragma", "no-cache");
  _res.set("Expires", "0");
  next();
});

// Simple request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.originalUrl }, "incoming request");
  next();
});

// Routes
app.use("/api/", limiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/lookup", lookupRoutes);

// Health check
app.get("/api/health", async (_req, res) => {
  const dbStart = Date.now();
  let dbOk = false;
  let propertyCount = 0;
  try {
    propertyCount = await prisma.property.count();
    dbOk = true;
  } catch {
    dbOk = false;
  }
  const dbMs = Date.now() - dbStart;

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: dbOk,
      responseTime: dbMs,
      propertyCount,
    },
    cloudinary: {
      configured: Boolean(process.env.CLOUDINARY_URL),
      cloud: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || null,
    },
    env: env.nodeEnv,
  });
});

// Sentry error handler (debe ir después de otros middlewares pero antes del error handler final)
if (sentryDsn) {
  Sentry.setupExpressErrorHandler(app);
}

// Error handler (debe ir último)
app.use(errorHandler);

// Export para serverless (Vercel) o listen local
// Graceful shutdown
let server: ReturnType<typeof app.listen> | null = null;

if (process.env.VERCEL) {
  exports.handler = serverless(app);
} else if (env.nodeEnv !== "test") {
  // Only start listener in non-test environments
  server = app.listen(env.port, () => {
    logger.info(`API running on http://localhost:${env.port}`);
  });

  const shutdown = async () => {
    logger.info("Shutting down");
    if (server) {
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
      // Force exit after 10s
      setTimeout(() => process.exit(1), 10000).unref();
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

export default app;
