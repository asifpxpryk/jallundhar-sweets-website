"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartContext";
import { SECTIONS } from "@/lib/sections";

export default function BottomNav() {
  const pathname = usePathname();
  const { open, isOpen } = useCart();

  const isHome = pathname === "/";
  const isCategories =
    pathname === "/categories" || SECTIONS.some((s) => pathname === `/${s.slug}`);
  const isAccount = pathname === "/account" || pathname.startsWith("/account/");

  const itemClass = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
      active ? "text-maroon-800" : "text-maroon-700/50"
    }`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-200 bg-[#fff8f0]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur xl:hidden">
      <div className="mx-auto flex max-w-6xl items-stretch">
        <Link href="/" className={itemClass(isHome && !isOpen)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={isHome && !isOpen ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
          </svg>
          Home
        </Link>
        <Link href="/categories" className={itemClass(isCategories && !isOpen)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="8" height="8" rx="1.5" />
            <rect x="13" y="3" width="8" height="8" rx="1.5" />
            <rect x="3" y="13" width="8" height="8" rx="1.5" />
            <rect x="13" y="13" width="8" height="8" rx="1.5" />
          </svg>
          Categories
        </Link>
        <button type="button" onClick={open} className={itemClass(isOpen)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="M3.3 7 12 12l8.7-5M12 22V12" />
          </svg>
          Orders
        </button>
        <Link href="/account" className={itemClass(isAccount && !isOpen)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
          </svg>
          Account
        </Link>
      </div>
    </nav>
  );
}
