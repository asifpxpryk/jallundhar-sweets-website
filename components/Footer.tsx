export default function Footer() {
  return (
    <footer id="contact" className="scroll-mt-20 bg-maroon-900 text-cream/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0 leading-tight">
          <h3 className="font-display text-sm font-bold text-cream sm:text-base">
            Jallundhar Sweets &amp; Bakers
          </h3>
          <p className="mt-0.5 text-xs sm:text-sm">Shahi Road, Rahim Yar Khan</p>
        </div>
        <a
          href="tel:03001538440"
          className="shrink-0 whitespace-nowrap text-sm font-medium text-cream hover:text-gold-300"
        >
          0300 153 8440
        </a>
      </div>
    </footer>
  );
}
