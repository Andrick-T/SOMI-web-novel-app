import { useEffect, useState } from "react";

export const getNetworkStatus = () => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
});

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    () => getNetworkStatus().isOnline,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
}
