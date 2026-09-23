import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { apiAuthRepository } from "../../services/repositories/authRepository";
import { appConfig } from "@/config/env";

export type AppRole = "reader" | "writer" | "admin";

export type UserStatus = "active" | "suspended" | "pending";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: AppRole;
  roles: AppRole[];
  status: UserStatus;
  createdAt: string;
}

interface AuthContextValue {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    payload?: Partial<AppUser> & {
      role?: AppRole;
      email?: string;
      password?: string;
    },
  ) => Promise<AppUser>;
  logout: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  error: string | null;
  setError: (message: string | null) => void;
}

/**
 * Demo-only user.
 *
 * This is intentionally retained for local development/testing.
 * Production never uses this fallback.
 */
const mockUserBase: AppUser = {
  id: "user-admin-01",
  name: "Kemi Nwosu",
  email: "kemi@somi.app",
  role: "admin",
  roles: ["admin"],
  status: "active",
  createdAt: "2024-01-10T00:00:00.000Z",
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  /**
   * Production is always API-authenticated.
   *
   * This prevents a production build from accidentally falling back
   * to the demo authentication system when VITE_USE_API_AUTH is false
   * or missing.
   *
   * Development can still explicitly opt into API authentication
   * through VITE_USE_API_AUTH=true.
   */
  const useApi = import.meta.env.PROD || appConfig.useApiAuth;

  const [user, setUser] = useState<AppUser | null>(
    useApi ? null : mockUserBase,
  );

  const [isLoading, setIsLoading] = useState(useApi);

  const [error, setError] = useState<string | null>(null);

  /**
   * Used to prevent an older async authentication request from
   * overwriting newer authentication state.
   */
  const authGeneration = useRef(0);

  /**
   * Restore an existing API session on application startup.
   */
  useEffect(() => {
    if (!useApi) return;

    const hasStoredAccessToken =
      typeof window !== "undefined" &&
      Boolean(window.sessionStorage.getItem("somi_access_token"));

    if (!hasStoredAccessToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const generation = authGeneration.current;

    apiAuthRepository
      .me()
      .then((nextUser) => {
        if (authGeneration.current === generation) {
          setUser(nextUser);
        }
      })
      .catch(() => {
        if (authGeneration.current === generation) {
          setUser(null);
        }
      })
      .finally(() => {
        if (authGeneration.current === generation) {
          setIsLoading(false);
        }
      });
  }, [useApi]);

  const login = useCallback(
    async (
      payload?: Partial<AppUser> & {
        role?: AppRole;
        email?: string;
        password?: string;
      },
    ): Promise<AppUser> => {
      setIsLoading(true);
      setError(null);
      authGeneration.current += 1;

      /**
       * API authentication path.
       *
       * In production this is the only authentication path.
       */
      if (useApi) {
        if (!payload?.email || !payload.password) {
          const message = "Email and password are required.";

          setError(message);
          setIsLoading(false);

          throw new Error(message);
        }

        try {
          const authenticatedUser = await (payload.name
            ? apiAuthRepository.register(
                payload.email,
                payload.password,
                payload.name,
              )
            : apiAuthRepository.login(payload.email, payload.password));

          setUser(authenticatedUser);

          return authenticatedUser;
        } catch (caught) {
          const message =
            caught instanceof Error
              ? caught.message
              : "Unable to authenticate.";

          setError(message);

          throw caught;
        } finally {
          setIsLoading(false);
        }
      }

      /**
       * Development-only mock authentication.
       *
       * This branch can never execute in a production build because
       * useApi is forced to true there.
       */
      const isAdminDemoLogin =
        payload?.email?.toLowerCase() === "admin@somi.app" &&
        payload?.password === "admin123";

      const nextRole = isAdminDemoLogin
        ? "admin"
        : (payload?.role ?? payload?.roles?.[0] ?? "reader");

      const nextUser: AppUser = {
        ...mockUserBase,
        ...payload,
        id: isAdminDemoLogin ? "admin-01" : (payload?.id ?? mockUserBase.id),
        name: isAdminDemoLogin
          ? "SOMI Admin"
          : (payload?.name ?? mockUserBase.name),
        email: isAdminDemoLogin
          ? "admin@somi.app"
          : (payload?.email ?? mockUserBase.email),
        role: nextRole,
        roles: payload?.roles ?? [nextRole],
        status: payload?.status ?? "active",
        createdAt: payload?.createdAt ?? mockUserBase.createdAt,
      };

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 250);
      });

      setUser(nextUser);
      setIsLoading(false);

      return nextUser;
    },
    [useApi],
  );

  const logout = useCallback(async () => {
    authGeneration.current += 1;

    if (useApi) {
      await apiAuthRepository.logout().catch(() => undefined);
    }

    setUser(null);
    setError(null);
  }, [useApi]);

  const hasRole = useCallback(
    (role: AppRole) => Boolean(user && user.roles.includes(role)),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      hasRole,
      error,
      setError,
    }),
    [error, hasRole, isLoading, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export { AuthContext };
