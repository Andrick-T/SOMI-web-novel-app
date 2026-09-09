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

const mockUserBase: AppUser = {
  id: "user-reader-01",
  name: "Kemi Nwosu",
  email: "kemi@somi.app",
  role: "reader",
  roles: ["reader"],
  status: "active",
  createdAt: "2024-01-10T00:00:00.000Z",
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const useApi = import.meta.env.VITE_USE_API_AUTH === "true";
  const [user, setUser] = useState<AppUser | null>(
    useApi ? null : mockUserBase,
  );
  const [isLoading, setIsLoading] = useState(useApi);
  const [error, setError] = useState<string | null>(null);
  const authGeneration = useRef(0);

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

      if (useApi && payload?.email && payload.password) {
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
          setError(
            caught instanceof Error ? caught.message : "Unable to sign in.",
          );
          throw caught;
        } finally {
          setIsLoading(false);
        }
      }

      const nextRole = payload?.role ?? payload?.roles?.[0] ?? "reader";

      const nextUser: AppUser = {
        ...mockUserBase,
        ...payload,
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
    if (useApi) await apiAuthRepository.logout().catch(() => undefined);
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
