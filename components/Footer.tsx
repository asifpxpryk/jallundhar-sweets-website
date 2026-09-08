import Link from "next/link";

const WHATSAPP_URL = "https://wa.me/923001538440";
const FACEBOOK_URL = "https://facebook.com/jallundharshahiroad";
const PHONE_TEL = "tel:03001538440";
const PHONE_LABEL = "0300 153 8440";

function GoldLine() {
  return <span className="h-px w-8 bg-gold-400/80" aria-hidden />;
}

function Ornament() {
  return (
    <div className="flex items-center justify-center gap-2 text-gold-400" aria-hidden>
      <span className="h-px w-8 bg-gold-400/70" />
      <span className="h-1.5 w-1.5 rotate-45 border border-gold-400/90" />
      <span className="h-px w-8 bg-gold-400/70" />
    </div>
  );
}

function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
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

function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.2" />
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

function IconFacebook() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1Z" />
    </svg>
  );
}

const linkClass =
  "inline-flex items-center gap-2 text-sm text-cream/90 transition hover:text-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300";

export default function Footer() {
  return (
    <footer id="contact" className="relative scroll-mt-20 overflow-hidden bg-maroon-900 text-cream">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          background:
            "radial-gradient(ellipse at left top, rgba(227,169,52,0.16), transparent 42%), radial-gradient(ellipse at right bottom, rgba(227,169,52,0.12), transparent 40%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-0">
          <div className="flex flex-col items-center text-center md:px-6">
            <div className="flex items-center gap-3" aria-hidden>
              <GoldLine />
              <svg width="22" height="18" viewBox="0 0 24 20" fill="none" className="text-gold-400">
                <path d="M4 8h16l-1.2 9.2A2 2 0 0 1 16.82 19H7.18a2 2 0 0 1-1.98-1.8L4 8Z" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 8V6.2A4 4 0 0 1 12 2a4 4 0 0 1 4 4.2V8" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              <GoldLine />
            </div>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight text-cream sm:text-4xl">
              Jallundhar
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-300">
              Sweets &amp; Bakers
            </p>
            <div className="mt-3">
              <Ornament />
            </div>
            <p className="mt-4 flex items-start justify-center gap-2 text-sm leading-snug text-cream/90">
              <span className="mt-0.5 text-gold-400">
                <IconPin />
              </span>
              <span>
                Shahi Road
                <br />
                Rahim Yar Khan
              </span>
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs italic text-gold-300">
              <span className="h-px w-6 bg-gold-400/70" aria-hidden />
              Making Life Sweeter
              <span className="h-px w-6 bg-gold-400/70" aria-hidden />
            </p>
          </div>

          <div className="flex flex-col items-center text-center md:border-l md:border-gold-400/25 md:px-8 md:items-start md:text-left">
            <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-gold-300">Quick Links</h2>
            <nav aria-label="Footer" className="mt-4 flex flex-col items-center gap-3 md:items-start">
              <Link href="/" className={linkClass}>
                <span className="text-gold-400">
                  <IconHome />
                </span>
                Home
              </Link>
              <Link href="/categories" className={linkClass}>
                <span className="text-gold-400">
                  <IconGrid />
                </span>
                Categories
              </Link>
              <a href="/#contact" className={linkClass}>
                <span className="text-gold-400">
                  <IconPhone />
                </span>
                Contact
              </a>
            </nav>
          </div>

          <div className="flex flex-col items-center text-center md:border-l md:border-gold-400/25 md:px-8 md:items-start md:text-left">
            <h2 className="font-display text-2xl font-semibold text-cream">Contact</h2>
            <a
              href={PHONE_TEL}
              className={`${linkClass} mt-4 text-base`}
              aria-label="Call 0300 153 8440"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-400/70 text-gold-300">
                <IconPhone />
              </span>
              {PHONE_LABEL}
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-gold-200 px-5 py-3 text-sm font-semibold text-maroon-900 shadow-sm transition hover:bg-gold-100 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 md:w-auto"
            >
              <span className="text-maroon-800">
                <IconWhatsApp />
              </span>
              WhatsApp Order
              <span aria-hidden className="text-maroon-800">
                ›
              </span>
            </a>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noreferrer"
              className={`${linkClass} mt-4`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-400 text-maroon-900">
                <IconFacebook />
              </span>
              Facebook
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-gold-400/30 pt-4">
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="text-[11px] text-cream/60">
              © 2026 Jallundhar Sweets &amp; Bakers. All rights reserved.
            </p>
            <p className="mt-4 hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-400 sm:flex">
              <span className="h-px w-6 bg-gold-400/70" aria-hidden />
              Sweet Moments. Brighter Days.
              <span className="h-px w-6 bg-gold-400/70" aria-hidden />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
