"use client";

import { useEffect } from "react";

function isProtectedTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("img, picture, svg, video, canvas"));
}

export default function ProtectImages() {
  useEffect(() => {
    function onContextMenu(event: MouseEvent) {
      if (isProtectedTarget(event.target)) event.preventDefault();
    }

    function onDragStart(event: DragEvent) {
      if (isProtectedTarget(event.target)) event.preventDefault();
    }

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  return null;
}
