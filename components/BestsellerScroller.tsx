"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import type { MenuItem } from "@/lib/types";
import ScrollProductCard from "./ScrollProductCard";

function shelfEdges(el: HTMLDivElement) {
  const max = el.scrollWidth - el.clientWidth;
  return {
    left: el.scrollLeft > 4,
    right: max - el.scrollLeft > 4,
  };
}

export default function BestsellerScroller({
  items,
  embedded = false,
  aisleSection,
  title = "Our Bestsellers",
  viewAllHref = "/categories",
  tone,
}: {
  items: MenuItem[];
  embedded?: boolean;
  aisleSection?: string;
  title?: string;
  viewAllHref?: string;
  tone?: "new" | "deal";
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const edgesRef = useRef({ left: false, right: false });
  const [edges, setEdges] = useState({ left: false, right: false });

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const sync = () => {
      const next = shelfEdges(el);
      const prev = edgesRef.current;
      if (prev.left === next.left && prev.right === next.right) return;
      edgesRef.current = next;
      setEdges(next);
    };
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [items]);

  if (items.length === 0) return null;

  const band =
    tone === "new"
      ? "rounded-3xl border border-gold-300 bg-gold-100 px-3 py-4 sm:px-4"
      : tone === "deal"
        ? "rounded-3xl border border-maroon-700/30 bg-[#f8e4e2] px-3 py-4 sm:px-4"
        : "";

  return (
    <section className={embedded ? "min-w-0 pb-2 pt-4" : "mx-auto w-full min-w-0 max-w-6xl px-4 pb-4 pt-2 sm:px-6"}>
      <div className={band}>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-maroon-800 sm:text-2xl">{title}</h2>
          {embedded ? null : (
            <Link
              href={viewAllHref}
              className="flex-shrink-0 text-sm font-medium text-maroon-800 hover:text-gold-600"
            >
              View All →
            </Link>
          )}
        </div>
        <div
          ref={scrollerRef}
          className="shelf-edge flex w-full min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pt-1 scrollbar-hide sm:gap-4"
          style={{
            ["--shelf-left" as string]: edges.left ? "2.25rem" : "0px",
            ["--shelf-right" as string]: edges.right ? "2.25rem" : "0px",
          }}
        >
          {items.map((item, index) => (
            <ScrollProductCard key={item.id} item={item} priority={index < 4} aisleSection={aisleSection} shelf={tone} />
          ))}
        </div>
      </div>
    </section>
  );
}
