import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import type { AppRole } from "../auth";

interface RequireAuthProps {
  allowedRoles?: AppRole[];
}

export function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { isAuthenticated, user, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.some((role) => hasRole(role))) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0b18] px-6 text-center text-[#f0ece4]">
      <div className="max-w-md">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#8b7ea8]">
          Access denied
        </p>
        <h1 className="font-display text-3xl font-bold">
          You do not have permission
        </h1>
        <p className="mt-3 text-sm text-[#8b7ea8]">
          This area is restricted to the appropriate SOMI role.
        </p>
      </div>
    </div>
  );
}
