import Link from "next/link";

export default function GiftPromoCard() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/gift-banner.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[78%_center]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #f6e0d2 0%, #f6e0d2 36%, rgba(246,224,210,0.72) 50%, rgba(246,224,210,0.28) 64%, rgba(246,224,210,0) 78%)",
          }}
        />
        <div className="relative z-10 flex min-h-[11rem] max-w-[62%] flex-col justify-center gap-2 px-5 py-5 sm:min-h-[13rem] sm:max-w-[52%] sm:px-8 sm:py-7">
          <h2 className="font-display text-xl font-bold leading-tight text-maroon-800 sm:text-3xl">
            Make Every Occasion Sweeter
          </h2>
          <p className="text-xs text-maroon-700/75 sm:text-sm">
            Explore our special gift packs for your loved ones.
          </p>
          <Link
            href="/sweets"
            className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-maroon-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-maroon-900"
          >
            View Gift Packs
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
