"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { ADMIN_UI_COOKIE } from "@/lib/site";

const AdminSessionContext = createContext(false);

function hasAdminUiHint() {
  return document.cookie.split(";").some((part) => part.trim().startsWith(`${ADMIN_UI_COOKIE}=`));
}

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!hasAdminUiHint()) return;
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
