export type AppConfig = {
  appName: string;
  appUrl: string;
  frontendUrl: string;
  apiBaseUrl: string;
  enablePwa: boolean;
  enableOfflineReading: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
};

const readEnv = (key: string, fallback: string): string =>
  (import.meta.env?.[key] as string | undefined) ?? fallback;

const normalizeBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
};

const defaultFrontendUrl = "https://somi-z5dq.onrender.com";
const configuredFrontendUrl = readEnv("VITE_FRONTEND_URL", defaultFrontendUrl);
const configuredAppUrl = readEnv("VITE_APP_URL", configuredFrontendUrl);

export const resolveFrontendUrl = (override?: string): string => {
  if (override) return override;

  if (typeof window !== "undefined" && import.meta.env.DEV) {
    return configuredAppUrl.startsWith("http")
      ? configuredAppUrl
      : window.location.origin || configuredFrontendUrl;
  }

  return configuredFrontendUrl;
};

export const appConfig: AppConfig = {
  appName: readEnv("VITE_APP_NAME", "SOMI"),
  appUrl: resolveFrontendUrl(),
  frontendUrl: configuredFrontendUrl,
  apiBaseUrl: readEnv("VITE_API_BASE_URL", "/"),
  enablePwa: normalizeBoolean(readEnv("VITE_ENABLE_PWA", "true"), true),
  enableOfflineReading: normalizeBoolean(
    readEnv("VITE_ENABLE_OFFLINE_READING", "true"),
    true,
  ),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export const getPublicOrigin = () => {
  if (typeof window === "undefined") return appConfig.frontendUrl;
  return import.meta.env.DEV && configuredAppUrl.startsWith("http")
    ? configuredAppUrl
    : window.location.origin || appConfig.frontendUrl;
};

export const validateAppConfig = () => {
  const errors: string[] = [];

  if (!appConfig.appName.trim()) {
    errors.push("VITE_APP_NAME is required");
  }

  if (!appConfig.appUrl.startsWith("http")) {
    errors.push("VITE_APP_URL must be an absolute URL");
  }

  if (!appConfig.frontendUrl.startsWith("http")) {
    errors.push("VITE_FRONTEND_URL must be an absolute URL");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
