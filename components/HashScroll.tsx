"use client";

import { useEffect } from "react";

export default function HashScroll() {
  useEffect(() => {
    function go() {
      const id = window.location.hash.replace("#", "");
      if (!id) return;
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
    const t = window.setTimeout(go, 80);
    window.addEventListener("hashchange", go);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", go);
    };
  }, []);
  return null;
}
