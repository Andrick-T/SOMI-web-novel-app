type LogSeverity = "info" | "warn" | "error";

const formatPayload = (
  message: string,
  meta: Record<string, unknown> = {},
) => ({
  timestamp: new Date().toISOString(),
  message,
  ...meta,
});

export const logger = {
  info: (message: string, meta: Record<string, unknown> = {}) => {
    console.info(
      JSON.stringify(formatPayload(message, { level: "info", ...meta })),
    );
  },
  warn: (message: string, meta: Record<string, unknown> = {}) => {
    console.warn(
      JSON.stringify(formatPayload(message, { level: "warn", ...meta })),
    );
  },
  error: (message: string, meta: Record<string, unknown> = {}) => {
    console.error(
      JSON.stringify(formatPayload(message, { level: "error", ...meta })),
    );
  },
  getSeverity: (): LogSeverity => "info",
};
