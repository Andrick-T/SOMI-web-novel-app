export type AppConfig = {
  appName: string;
  appUrl: string;
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

export const appConfig: AppConfig = {
  appName: readEnv("VITE_APP_NAME", "SOMI"),
  appUrl: readEnv("VITE_APP_URL", "https://somi.app"),
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
  if (typeof window === "undefined") return appConfig.appUrl;
  return window.location.origin || appConfig.appUrl;
};

export const validateAppConfig = () => {
  const errors: string[] = [];

  if (!appConfig.appName.trim()) {
    errors.push("VITE_APP_NAME is required");
  }

  if (!appConfig.appUrl.startsWith("http")) {
    errors.push("VITE_APP_URL must be an absolute URL");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
