"use client";

import { useEffect, useRef } from "react";
import { trackViewContent } from "@/lib/metaPixel";

function scrollToHash() {
  const id = window.location.hash.replace("#", "");
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  return true;
}

function fireViewContentFromHash() {
  const raw = window.location.hash.replace("#", "");
  if (!raw) return;
  const id = raw.startsWith("item-") ? raw.slice("item-".length) : raw;
  if (!id) return;
  trackViewContent({
    content_ids: [id],
    content_name: id,
    content_type: "product",
  });
}

export default function HashScroll() {
  const last = useRef("");
  useEffect(() => {
    let tries = 0;
    let timer = 0;

    function attempt() {
      if (scrollToHash() || tries++ > 25) return;
      timer = window.setTimeout(attempt, 80);
    }

    function restart() {
      tries = 0;
      window.clearTimeout(timer);
      attempt();
      const raw = window.location.hash.replace("#", "");
      if (raw && raw !== last.current) {
        last.current = raw;
        fireViewContentFromHash();
      }
    }

    restart();
    window.addEventListener("hashchange", restart);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", restart);
    };
  }, []);
  return null;
}
