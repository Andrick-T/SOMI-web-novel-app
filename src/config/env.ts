export type AppConfig = {
  appName: string;
  appUrl: string;
  frontendUrl: string;
  apiBaseUrl: string;
  giphyApiKey: string;

  useApiAuth: boolean;
  useApiContent: boolean;
  useApiEconomy: boolean;
  useApiLibrary: boolean;

  enablePwa: boolean;
  enableOfflineReading: boolean;

  isDevelopment: boolean;
  isProduction: boolean;
};

const readEnv = (key: string, fallback: string): string =>
  (import.meta.env?.[key] as string | undefined) ?? fallback;

const normalizeBoolean = (
  value: string | undefined,
  fallback: boolean,
): boolean => {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
};

const defaultFrontendUrl = "https://somi-z5dq.onrender.com";

const configuredFrontendUrl = readEnv("VITE_FRONTEND_URL", defaultFrontendUrl);

const configuredAppUrl = readEnv("VITE_APP_URL", configuredFrontendUrl);

const isProduction = import.meta.env.PROD;

const defaultApiBaseUrl = isProduction ? "/" : "http://localhost:4000";

const configuredApiBaseUrl = readEnv("VITE_API_BASE_URL", defaultApiBaseUrl);

/**
 * Prevent a development localhost API URL from accidentally being
 * baked into a production frontend build.
 *
 * Production should receive its real API base URL through the
 * deployment environment. If none is provided, "/" keeps the
 * application same-origin rather than attempting localhost.
 */
const productionApiBaseUrl =
  isProduction &&
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(configuredApiBaseUrl)
    ? defaultApiBaseUrl
    : configuredApiBaseUrl;

const requestedUseApiAuth = normalizeBoolean(
  import.meta.env.VITE_USE_API_AUTH,
  false,
);

const requestedUseApiContent = normalizeBoolean(
  import.meta.env.VITE_USE_API_CONTENT,
  false,
);

const requestedUseApiEconomy = normalizeBoolean(
  import.meta.env.VITE_USE_API_ECONOMY,
  false,
);

const requestedUseApiLibrary = normalizeBoolean(
  import.meta.env.VITE_USE_API_LIBRARY,
  false,
);

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

  apiBaseUrl: productionApiBaseUrl,

  giphyApiKey: readEnv("VITE_GIPHY_API_KEY", ""),

  // Production is never allowed to use mock authentication.
  useApiAuth: isProduction ? true : requestedUseApiAuth,

  // Production is never allowed to use mock catalog/content data.
  useApiContent: isProduction ? true : requestedUseApiContent,

  // Production is never allowed to use the mock economy.
  useApiEconomy: isProduction ? true : requestedUseApiEconomy,

  // Production is never allowed to use local/mock library state.
  useApiLibrary: isProduction ? true : requestedUseApiLibrary,

  enablePwa: normalizeBoolean(readEnv("VITE_ENABLE_PWA", "true"), true),

  enableOfflineReading: normalizeBoolean(
    readEnv("VITE_ENABLE_OFFLINE_READING", "true"),
    true,
  ),

  isDevelopment: import.meta.env.DEV,

  isProduction,
};

export const getPublicOrigin = () => {
  if (typeof window === "undefined") {
    return appConfig.frontendUrl;
  }

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

  if (!appConfig.apiBaseUrl.trim()) {
    errors.push("VITE_API_BASE_URL is required");
  }

  if (appConfig.isProduction) {
    if (!appConfig.useApiAuth) {
      errors.push("Production authentication must use the API");
    }

    if (!appConfig.useApiContent) {
      errors.push("Production content must use the API");
    }

    if (!appConfig.useApiEconomy) {
      errors.push("Production economy must use the API");
    }

    if (!appConfig.useApiLibrary) {
      errors.push("Production library must use the API");
    }

    if (
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(appConfig.apiBaseUrl)
    ) {
      errors.push("Production API base URL cannot point to localhost");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
