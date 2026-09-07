export default function Footer() {
  return (
    <footer id="contact" className="scroll-mt-20 bg-maroon-900 text-cream/80">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="font-display text-lg font-bold text-cream">
              Jallundhar Sweets &amp; Bakers
            </h3>
            <p className="mt-2 text-sm">Shahi Road, Rahim Yar Khan</p>
            <p className="mt-1 text-sm">Since 1959</p>
          </div>
          <div>
            <h4 className="font-semibold text-gold-300">Contact</h4>
            <p className="mt-2 text-sm">
              <a href="tel:03001538440" className="hover:text-gold-300">
                0300 153 8440
              </a>
            </p>
            <p className="mt-1 text-sm">
              <a
                href="https://wa.me/923001538440"
                target="_blank"
                rel="noreferrer"
                className="hover:text-gold-300"
              >
                WhatsApp Order
              </a>
            </p>
            <p className="mt-1 text-sm">
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
          <div>
            <h4 className="font-semibold text-gold-300">Offers</h4>
            <p className="mt-2 text-sm">10% off on all cafe menu items</p>
            <p className="mt-1 text-sm">Happy Hours: Thursdays 4 PM – 7 PM</p>
          </div>
        </div>
        <p className="mt-10 border-t border-cream/10 pt-6 text-xs text-cream/50">
          © {new Date().getFullYear()} Jallundhar Sweets &amp; Bakers. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
