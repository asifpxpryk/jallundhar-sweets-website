"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SKIP = [/^\/admin(?:\/|$)/, /^\/account(?:\/|$)/, /^\/api(?:\/|$)/];
const BOT_UA = /bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit/i;

export default function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || SKIP.some((pattern) => pattern.test(pathname))) return;
    // Crawlers render pages too; do not spend a server call counting them.
    if (navigator.webdriver || BOT_UA.test(navigator.userAgent)) return;
    // One call per page per browser session: reloads and back/forward do not hit the server again.
    const seenKey = `jallundhar-visit:${pathname}`;
    try {
      if (sessionStorage.getItem(seenKey)) return;
      sessionStorage.setItem(seenKey, "1");
    } catch {
      /* storage blocked: still count the visit */
    }
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
