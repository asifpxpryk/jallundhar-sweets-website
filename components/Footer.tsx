import Link from "next/link";

const WHATSAPP_URL = "https://wa.me/923001538440";
const FACEBOOK_URL = "https://facebook.com/jallundharshahiroad";
const PHONE_TEL = "tel:03001538440";
const PHONE_LABEL = "0300 153 8440";

const linkClass =
  "text-sm text-cream/90 transition hover:text-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300";

function IconPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.31 1.77.57 2.61a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.47-1.14a2 2 0 0 1 2.11-.45c.84.26 1.71.45 2.61.57A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.96.52 3.86 1.5 5.54L2 22l4.78-1.55a10.07 10.07 0 0 0 5.26 1.37h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2Zm5.77 13.95c-.24.68-1.4 1.25-1.94 1.33-.5.07-1.13.1-1.83-.12-.42-.13-.97-.32-1.67-.62-2.94-1.27-4.85-4.22-5-4.42-.14-.2-1.17-1.55-1.17-2.96 0-1.4.74-2.09 1-2.37.26-.28.57-.35.76-.35h.55c.18 0 .41-.07.64.49.24.58.82 2 .89 2.15.07.14.12.31.02.5-.1.2-.14.32-.28.49-.14.17-.3.38-.42.51-.14.14-.28.29-.12.56.14.28.64 1.06 1.38 1.72.95.84 1.75 1.1 2.03 1.23.28.14.45.12.62-.07.17-.2.71-.82.9-1.1.19-.28.38-.23.64-.14.26.1 1.64.77 1.92.91.28.14.47.21.54.32.07.12.07.68-.17 1.36Z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer id="contact" className="relative scroll-mt-20 overflow-hidden bg-maroon-900 text-cream">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(227,169,52,0.14), transparent 55%)",
        }}
      />

      <div className="relative mx-auto flex max-w-lg flex-col items-center px-5 py-8 text-center sm:px-8">
        <div className="flex items-center gap-3 text-gold-400" aria-hidden>
          <span className="h-px w-8 bg-gold-400/70" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 8h12l-1 11H7L6 8Z" />
            <path d="M9 8V7a3 3 0 0 1 6 0v1" />
            <path d="M6 8H4M20 8h-2" />
          </svg>
          <span className="h-px w-8 bg-gold-400/70" />
        </div>

        <p className="mt-3 font-display text-3xl font-bold tracking-tight text-cream">Jallundhar</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-300">
          Sweets &amp; Bakers
        </p>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-cream/90">
          <span className="text-gold-400">
            <IconPin />
          </span>
          Shahi Road, Rahim Yar Khan
        </p>

        <nav aria-label="Footer" className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/" className={linkClass}>
            Home
          </Link>
          <Link href="/categories" className={linkClass}>
            Categories
          </Link>
          <a href="/#contact" className={linkClass}>
            Contact
          </a>
        </nav>

        <a href={PHONE_TEL} className={`${linkClass} mt-5 inline-flex items-center gap-2 text-base`} aria-label="Call 0300 153 8440">
          <span className="text-gold-400">
            <IconPhone />
          </span>
          {PHONE_LABEL}
        </a>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-gold-200 px-5 py-3 text-sm font-semibold text-maroon-900 transition hover:bg-gold-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
        >
          <span className="text-maroon-800">
            <IconWhatsApp />
          </span>
          WhatsApp Order
          <span aria-hidden>›</span>
        </a>

        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noreferrer"
          className={`${linkClass} mt-4 inline-flex items-center gap-2`}
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full border border-gold-400/80 text-[12px] font-bold leading-none text-gold-300"
            aria-hidden
          >
            f
          </span>
          Facebook
        </a>

        <div className="mt-6 w-full border-t border-gold-400/30 pt-4">
          <p className="text-[11px] text-cream/60">© 2026 Jallundhar Sweets &amp; Bakers</p>
        </div>
      </div>
    </footer>
  );
}
