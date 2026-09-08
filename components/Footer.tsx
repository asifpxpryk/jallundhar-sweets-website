export default function Footer() {
  return (
    <footer id="contact" className="scroll-mt-20 bg-maroon-900 text-cream/80">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-8 px-10 py-4 sm:px-16 lg:px-24">
        <div className="min-w-0 text-center leading-tight">
          <p className="font-display text-xl font-bold text-cream sm:text-2xl">Jallundhar</p>
          <p className="mt-0.5 font-display text-sm font-semibold text-cream sm:text-base">
            Sweets &amp; Bakers
          </p>
          <p className="mt-1.5 text-sm">Shahi Road</p>
          <p className="text-sm">Rahim Yar Khan</p>
        </div>
        <div className="shrink-0 text-center leading-tight">
          <h4 className="font-semibold text-gold-300">Contact</h4>
          <p className="mt-1 text-sm">
            <a href="tel:03001538440" className="hover:text-gold-300">
              0300 153 8440
            </a>
          </p>
          <p className="text-sm">
            <a
              href="https://wa.me/923001538440"
              target="_blank"
              rel="noreferrer"
              className="hover:text-gold-300"
            >
              WhatsApp Order
            </a>
          </p>
          <p className="text-sm">
            <a
              href="https://facebook.com/jallundharshahiroad"
              target="_blank"
              rel="noreferrer"
              className="hover:text-gold-300"
            >
              Facebook
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
