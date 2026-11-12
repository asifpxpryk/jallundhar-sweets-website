"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "./CartContext";

/**
 * Storefront-wide motion that needs no changes in individual cards:
 * 1. When the cart count goes up, a gold dot flies from the last tap to the cart button.
 * 2. Product cards (.card-reveal) below the fold rise in as they scroll into view.
 */
export default function CartFly() {
  const { count } = useCart();
  const pathname = usePathname();
  const lastTap = useRef<{ x: number; y: number; at: number } | null>(null);
  const previous = useRef<number | null>(null);

  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      lastTap.current = { x: event.clientX, y: event.clientY, at: Date.now() };
    };
    window.addEventListener("pointerdown", onDown, { passive: true, capture: true });
    return () => window.removeEventListener("pointerdown", onDown, { capture: true });
  }, []);

  useEffect(() => {
    const before = previous.current;
    previous.current = count;
    if (before === null || count <= before) return;
    const tap = lastTap.current;
    const target = document.getElementById("cart-button");
    if (!tap || !target || Date.now() - tap.at > 1500) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = target.getBoundingClientRect();
    const endX = rect.left + rect.width / 2;
    const endY = rect.top + rect.height / 2;
    const dot = document.createElement("span");
    dot.className = "cart-fly-dot";
    document.body.appendChild(dot);
    const lift = Math.min(tap.y, endY) - 80;
    const animation = dot.animate(
      [
        { transform: `translate(${tap.x}px, ${tap.y}px) scale(1)`, opacity: 1 },
        { transform: `translate(${(tap.x + endX) / 2}px, ${lift}px) scale(1.25)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${endX}px, ${endY}px) scale(0.3)`, opacity: 0.4 },
      ],
      { duration: 650, easing: "cubic-bezier(0.3, 0, 0.3, 1)" }
    );
    animation.onfinish = () => dot.remove();
    animation.oncancel = () => dot.remove();
  }, [count]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const seen = new WeakSet<Element>();
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal.unobserve(entry.target);
          // Web Animations only: no class or attribute changes, so React hydration is untouched
          // and a card can never be left hidden.
          entry.target.animate(
            [
              { opacity: 0, transform: "translateY(28px) scale(0.97)" },
              { opacity: 1, transform: "none" },
            ],
            { duration: 600, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" }
          );
        }
      },
      { rootMargin: "0px 0px -4% 0px" }
    );

    const arm = () => {
      document.querySelectorAll<HTMLElement>(".card-reveal").forEach((card) => {
        if (seen.has(card)) return;
        seen.add(card);
        // Cards already on screen stay as they are; only ones below the fold animate in.
        if (card.getBoundingClientRect().top < window.innerHeight * 0.92) return;
        reveal.observe(card);
      });
    };

    arm();
    const mutations = new MutationObserver(arm);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      mutations.disconnect();
      reveal.disconnect();
    };
  }, [pathname]);

  return null;
}
