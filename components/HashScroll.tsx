"use client";

import { useEffect } from "react";

function scrollToHash() {
  const id = window.location.hash.replace("#", "");
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  return true;
}

export default function HashScroll() {
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
