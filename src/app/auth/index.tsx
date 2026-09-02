import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

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
  login: (payload?: Partial<AppUser> & { role?: AppRole }) => void;
  logout: () => void;
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
  const [user, setUser] = useState<AppUser | null>(mockUserBase);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    (payload?: Partial<AppUser> & { role?: AppRole }) => {
      setIsLoading(true);
      setError(null);

      window.setTimeout(() => {
        const nextRole = payload?.role ?? payload?.roles?.[0] ?? "reader";
        const nextUser: AppUser = {
          ...mockUserBase,
          ...payload,
          role: nextRole,
          roles: payload?.roles ?? [nextRole],
          status: payload?.status ?? "active",
          createdAt: payload?.createdAt ?? mockUserBase.createdAt,
        };

        setUser(nextUser);
        setIsLoading(false);
      }, 250);
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

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
