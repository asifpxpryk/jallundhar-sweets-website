import Link from "next/link";

export default function Hero() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6">
      <section
        id="top"
        className="relative overflow-hidden rounded-3xl bg-maroon-800 text-cream"
        style={{
          backgroundImage:
            "linear-gradient(115deg, rgba(30,8,10,0.97) 0%, rgba(30,8,10,0.94) 48%, rgba(30,8,10,0.7) 68%, rgba(30,8,10,0.35) 100%), url('/hero.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex flex-col gap-2 px-5 py-5 sm:px-8 sm:py-7">
          <span className="w-fit rounded-full bg-gold-500/20 px-3 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-gold-300 sm:text-xs">
            Tradition in Every Bite · Since 1959
          </span>
          <h1 className="max-w-md font-display text-xl font-bold leading-tight sm:text-3xl">
            Bringing Sweetness to Your Moments
          </h1>
          <p className="max-w-sm text-xs text-cream/80 sm:text-sm">
            Premium mithai, fresh bakery, custom cakes, pizza, burgers &amp; more — Order Now.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/sweets"
              className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-5 py-2 text-sm font-semibold text-maroon-900 shadow-lg shadow-gold-900/20 transition hover:bg-gold-400"
            >
              Shop Now
              <span aria-hidden>→</span>
            </Link>
            <a
              href="tel:03001538440"
              className="rounded-full border border-cream/30 px-5 py-2 text-sm font-semibold text-cream transition hover:bg-cream/10"
            >
              Call: 0300 153 8440
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
