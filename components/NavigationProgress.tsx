"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin gold bar across the top of the screen from the moment a link is tapped until the next page shows.
 * A product page that nobody has opened yet takes about a second to build on the server; without this the
 * tap looked like it did nothing.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const timer = useRef<number | null>(null);

  // New page is on screen: finish the bar.
  useEffect(() => {
    setActive(false);
    if (timer.current) window.clearTimeout(timer.current);
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      // No defaultPrevented check: next/link always prevents the default and navigates itself.
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (or only a #section on it): nothing to wait for.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setActive(true);
      // Never leave the bar stuck if the navigation is cancelled.
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setActive(false), 15000);
    }
    // Capture phase: runs before the link's own handler.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!active) return null;
  return (
    <div className="nav-progress" role="progressbar" aria-label="Loading page" aria-busy="true">
      <span />
    </div>
  );
}
