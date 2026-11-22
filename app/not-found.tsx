import Link from "next/link";
import { SITE_WHATSAPP_URL } from "@/lib/site";

// Shown for any page or product that doesn't exist. Replaces Next's built-in page, which turns black on
// phones in dark mode and has no way back into the shop.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">404</p>
      <h1 className="mt-3 font-royal text-3xl text-maroon-800 sm:text-4xl">This page isn&apos;t on our shelves</h1>
      <p className="mt-4 text-base text-maroon-900/75">
        The item may have been renamed or is no longer sold. Have a look around the shop, or ask us on WhatsApp.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-maroon-700 px-6 py-3 font-display text-sm font-semibold text-white shadow-sm hover:bg-maroon-800"
        >
          Go to home
        </Link>
        <Link
          href="/categories"
          className="rounded-full border border-maroon-200 bg-white px-6 py-3 font-display text-sm font-semibold text-maroon-800 hover:bg-maroon-50"
        >
          Browse categories
        </Link>
        <a
          href={SITE_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-gold-300 bg-gold-50 px-6 py-3 font-display text-sm font-semibold text-gold-800 hover:bg-gold-100"
        >
          WhatsApp us
        </a>
      </div>
    </main>
  );
}
