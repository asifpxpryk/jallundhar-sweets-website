"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ADMIN_UI_COOKIE } from "@/lib/site";

const AdminSessionContext = createContext(false);

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Only admins carry the UI cookie; skip the server call for every other visitor.
    if (!document.cookie.split("; ").some((c) => c.startsWith(`${ADMIN_UI_COOKIE}=`))) return;
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
