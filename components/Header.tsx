"use client";

import { useState } from "react";
import { useCart } from "./CartContext";

const NAV_LINKS = [
  { href: "#mithai", label: "Mithai" },
  { href: "#bakery", label: "Bakery" },
  { href: "#cakes", label: "Cakes" },
  { href: "#cafe", label: "Cafe" },
  { href: "#store", label: "Store" },
  { href: "#deals", label: "Deals" },
  { href: "#contact", label: "Visit" },
];

export default function Header() {
  const { count, open } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gold-200 bg-cream/95 backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="flex-1" />

        <a href="#top" className="flex flex-shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://jallundharmain.com/wp-content/uploads/2021/07/jallundhar-logo.png"
            alt="Jallundhar Sweets & Bakers"
            className="h-7 w-7 flex-shrink-0 rounded-full object-contain sm:h-9 sm:w-9"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="flex flex-col items-center leading-tight">
            <span
              className="whitespace-nowrap font-display font-bold tracking-tight text-maroon-800"
              style={{ fontSize: "clamp(0.68rem, 3.2vw, 1.1rem)" }}
            >
              Jallundhar <span className="text-gold-600">Sweets &amp; Bakers</span>
            </span>
            <span
              className="whitespace-nowrap font-medium text-maroon-700/60"
              style={{ fontSize: "clamp(0.5rem, 2vw, 0.68rem)" }}
            >
              Shahi Road, Rahim Yar Khan
            </span>
          </div>
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium text-maroon-700 lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-gold-600">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-1 flex-shrink-0 items-center justify-end gap-2">
          <button
            onClick={open}
            className="relative flex items-center gap-2 rounded-full bg-maroon-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-maroon-800 sm:px-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-maroon-900">
                {count}
              </span>
            )}
          </button>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-300 text-maroon-700 lg:hidden"
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <nav className="absolute left-1/2 top-full z-50 mt-2 w-48 -translate-x-1/2 overflow-hidden rounded-2xl border border-gold-200 bg-white p-2 shadow-xl lg:hidden">
              <ul className="flex flex-col gap-0.5">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-maroon-700 transition hover:bg-gold-50 hover:text-gold-600"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
