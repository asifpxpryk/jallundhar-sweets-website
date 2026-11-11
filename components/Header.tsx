"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useCart } from "./CartContext";
import HeaderSearch from "./HeaderSearch";
import { logoutAdmin } from "@/app/admin/actions";
import { useIsAdmin } from "./AdminSessionContext";

export default function Header({
  hiddenSections = [],
  navSections = [],
}: {
  hiddenSections?: string[];
  navSections?: { href: string; label: string }[];
}) {
  const { count, open } = useCart();
  const pathname = usePathname();
  const isAdmin = useIsAdmin();
  const hidden = new Set(hiddenSections);
  const links = navSections.filter((section) => !hidden.has(section.href.replace(/^\//, "")));
  const navLinks = [...links, { href: "/live-kitchen", label: "Live Kitchen" }];

  return (
    <header className="sticky top-0 z-40 w-full max-w-[100vw] overflow-x-clip royal-header border-b border-gold-500/40 text-cream shadow-lg shadow-maroon-900/20">
      {isAdmin ? (
        <div className="bg-gold-400 text-maroon-950">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
            <p className="min-w-0 text-xs font-bold sm:text-sm">
              Admin mode — this is not the customer view
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/account"
                className="rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-maroon-900 sm:text-xs"
              >
                Admin panel
              </Link>
              <form action={logoutAdmin}>
                <button
                  type="submit"
                  className="rounded-full bg-maroon-800 px-3 py-1.5 text-[11px] font-semibold text-white sm:text-xs"
                >
                  Log out to view site
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
      <div className="relative mx-auto flex w-full min-w-0 max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden xl:flex-none">
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Jallundhar Sweets & Bakers"
              width={36}
              height={36}
              className="h-9 w-9 max-h-9 max-w-9 object-contain"
            />
          </span>
          <div className="flex min-w-0 flex-col items-center justify-center">
            <span className="block max-w-full truncate font-display text-[15px] font-bold leading-5 tracking-tight text-cream">
              Jallundhar <span className="text-gold-300">Sweets &amp; Bakers</span>
            </span>
            <span className="block max-w-full truncate text-center text-[11px] font-medium leading-4 text-cream/60">
              Shahi Road, Rahim Yar Khan
            </span>
          </div>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 px-4 text-sm font-medium text-cream/85 xl:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap transition hover:text-gold-300 ${
                pathname === link.href ? "font-semibold text-gold-300" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          <button
            id="cart-button"
            onClick={open}
            className="btn-gold relative flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-maroon-900 shadow-sm transition active:scale-95 sm:px-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span key={count} className="cart-bump absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-cream text-xs font-bold text-maroon-900 ring-2 ring-maroon-800">
                {count}
              </span>
            )}
          </button>
          <Link
            href="/account"
            aria-label="Account"
            className="hidden h-11 w-11 items-center justify-center rounded-full border border-gold-300/50 text-gold-200 xl:flex"
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
