"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AdminSessionContext = createContext(false);

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin-session")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setIsAdmin(Boolean(data?.isAdmin));
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <AdminSessionContext.Provider value={isAdmin}>{children}</AdminSessionContext.Provider>;
}

export function useIsAdmin() {
  return useContext(AdminSessionContext);
}
