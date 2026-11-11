import Image from "next/image";
import Link from "next/link";

const SPARKLES = [
  { left: "8%", top: "18%", delay: "0s" },
  { left: "22%", top: "78%", delay: "0.9s" },
  { left: "41%", top: "12%", delay: "1.7s" },
  { left: "55%", top: "84%", delay: "0.4s" },
  { left: "71%", top: "9%", delay: "2.2s" },
  { left: "90%", top: "70%", delay: "1.2s" },
];

export default function Hero() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6">
      <section
        id="top"
        className="relative isolate min-h-[23rem] overflow-hidden rounded-[2rem] bg-[#1e080a] text-cream shadow-xl shadow-maroon-900/20 sm:min-h-[26rem]"
      >
        <div className="absolute inset-0 sm:left-[38%]">
          <div className="hero-photo absolute -inset-[4%]">
            <Image
              src="/hero.webp"
              alt="Jallundhar mithai tray"
              fill
              priority
              unoptimized
              sizes="(min-width: 1152px) 720px, 100vw"
              className="object-cover object-[64%_center]"
            />
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-0 sm:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(30,8,10,0.15) 0%, rgba(30,8,10,0.7) 34%, rgba(30,8,10,0.97) 72%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden sm:block"
          style={{
            background:
              "linear-gradient(100deg, rgba(30,8,10,1) 0%, rgba(30,8,10,0.96) 36%, rgba(30,8,10,0.55) 58%, rgba(30,8,10,0.05) 100%)",
          }}
        />
        <div className="hero-sparkles pointer-events-none absolute inset-0" aria-hidden>
          {SPARKLES.map((dot) => (
            <span key={dot.left} style={{ left: dot.left, top: dot.top, animationDelay: dot.delay }} />
          ))}
        </div>

        <div className="relative flex min-h-[23rem] flex-col justify-end gap-3 px-5 pb-6 pt-28 sm:min-h-[26rem] sm:max-w-[60%] sm:justify-center sm:px-10 sm:py-10">
          <div className="lk-rise">
            <span className="inline-block w-fit rounded-full border border-gold-300/30 bg-gold-500/15 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-gold-200 backdrop-blur sm:text-xs">
              Tradition in Every Bite · Since 1959
            </span>
            <span className="hero-since-line mt-2 block h-px w-16 bg-gold-300" aria-hidden />
          </div>
          <p
            className="lk-rise font-display text-[2rem] font-extrabold leading-[1.08] tracking-tight sm:text-5xl"
            style={{ animationDelay: "90ms" }}
          >
            Bringing <span className="hero-gold-text">Sweetness</span>
            <br />
            to Your Moments
          </p>
          <p className="lk-rise max-w-md text-sm leading-relaxed text-cream/80 sm:text-base" style={{ animationDelay: "180ms" }}>
            Premium mithai and fresh bakery, a full General Store, and Live Kitchen.
          </p>
          <div className="lk-rise flex flex-wrap items-center gap-2.5 pt-1" style={{ animationDelay: "270ms" }}>
            <Link
              href="/sweets"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-maroon-900 shadow-lg shadow-gold-900/30 transition hover:-translate-y-0.5 hover:bg-gold-400"
            >
              Shop Sweets &amp; Bakery
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/live-kitchen"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#ff9d3c]/60 bg-[#ff7a1a]/15 px-4 py-2.5 text-sm font-semibold text-[#ffd9a8] backdrop-blur transition hover:-translate-y-0.5 hover:bg-[#ff7a1a]/30"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff7a1a] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff9d3c]" />
              </span>
              Live Kitchen
            </Link>
            <a
              href="tel:03001538440"
              className="rounded-full border border-cream/25 px-4 py-2.5 text-center text-sm font-semibold text-cream transition hover:bg-cream/10"
            >
              Call: 0300 153 8440
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
