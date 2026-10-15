"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SKIP = [/^\/admin(?:\/|$)/, /^\/account(?:\/|$)/, /^\/api(?:\/|$)/];

export default function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || SKIP.some((pattern) => pattern.test(pathname))) return;
    let visitorId = localStorage.getItem("jallundhar-visitor");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("jallundhar-visitor", visitorId);
    }
    const payload = JSON.stringify({ path: pathname, visitorId });
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon("/api/visit", blob)) return;
    void fetch("/api/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    });
  }, [pathname]);

  return null;
}
