const formatPayload = (message, meta = {}) => ({
    timestamp: new Date().toISOString(),
    message,
    ...meta,
});
export const logger = {
    info: (message, meta = {}) => {
        console.info(JSON.stringify(formatPayload(message, { level: "info", ...meta })));
    },
    warn: (message, meta = {}) => {
        console.warn(JSON.stringify(formatPayload(message, { level: "warn", ...meta })));
    },
    error: (message, meta = {}) => {
        console.error(JSON.stringify(formatPayload(message, { level: "error", ...meta })));
    },
    getSeverity: () => "info",
};
