"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useCart } from "./CartContext";
import { SECTIONS } from "@/lib/sections";
import HeaderSearch from "./HeaderSearch";

export default function Header({ hiddenSections = [] }: { hiddenSections?: string[] }) {
  const { count, open } = useCart();
  const pathname = usePathname();
  const hidden = new Set(hiddenSections);
  const navLinks = [
    ...SECTIONS.filter((section) => !hidden.has(section.slug)).map((section) => ({
      href: `/${section.slug}`,
      label: section.name,
    })),
    { href: "/#contact", label: "Visit" },
  ];

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
          {navLinks.map((link) => (
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
          <Link
            href="/account"
            aria-label="Account"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-gold-300 text-maroon-700 xl:flex"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
            </svg>
          </Link>
          <HeaderSearch />
        </div>
      </div>
    </header>
  );
}
