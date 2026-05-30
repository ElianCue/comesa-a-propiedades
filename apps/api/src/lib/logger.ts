let logger: any;

try {
  // try dynamic import to avoid failing tests if pino is not installed in this environment
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pino = require("pino");
  const isDev = process.env.NODE_ENV !== "production";
  logger = pino({
    transport: isDev
      ? {
          target: "pino-pretty",
          options: { colorize: true, translateTime: true },
        }
      : undefined,
  });
} catch (e) {
  // fallback minimal logger
  logger = {
    info: (...args: any[]) => console.log(...args),
    warn: (...args: any[]) => console.warn(...args),
    error: (...args: any[]) => console.error(...args),
    debug: (...args: any[]) => console.debug(...args),
  };
}

export { logger };
export default logger;
