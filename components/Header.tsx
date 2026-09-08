"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartContext";
import { SECTIONS } from "@/lib/sections";

const NAV_LINKS = [
  ...SECTIONS.map((section) => ({ href: `/${section.slug}`, label: section.name })),
  { href: "/#contact", label: "Visit" },
];

export default function Header() {
  const { count, open } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 overflow-x-hidden border-b border-gold-200 bg-cream/95 backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://jallundharmain.com/wp-content/uploads/2021/07/jallundhar-logo.png"
              alt="Jallundhar Sweets & Bakers"
              width={36}
              height={36}
              className="h-9 w-9 max-h-9 max-w-9 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </span>
          <div className="flex min-w-0 flex-col items-center justify-center text-center">
            <span className="whitespace-nowrap font-display text-[15px] font-bold leading-5 tracking-tight text-maroon-800">
              Jallundhar <span className="text-gold-600">Sweets &amp; Bakers</span>
            </span>
            <span className="whitespace-nowrap text-[11px] font-medium leading-4 text-maroon-700/60">
              Shahi Road, Rahim Yar Khan
            </span>
          </div>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-4 text-sm font-medium text-maroon-700 xl:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition hover:text-gold-600 ${
                pathname === link.href ? "font-semibold text-gold-600" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          <button
            onClick={open}
            className="relative flex h-9 items-center gap-2 rounded-full bg-maroon-700 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-maroon-800 sm:px-4"
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
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-300 text-maroon-700 xl:hidden"
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
            <div className="fixed inset-0 z-40 xl:hidden" onClick={() => setMenuOpen(false)} />
            <nav className="absolute right-4 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-gold-200 bg-white p-2 shadow-xl sm:right-6 xl:hidden">
              <ul className="flex flex-col gap-0.5">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-maroon-700 transition hover:bg-gold-50 hover:text-gold-600"
                    >
                      {link.label}
                    </Link>
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
