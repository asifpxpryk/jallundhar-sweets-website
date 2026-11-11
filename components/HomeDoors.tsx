import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";
import KitchenArt from "./KitchenArt";
import { kitchenHoursLabel, visibleKitchenGroups } from "@/lib/liveKitchen";
import { loadKitchenConfig } from "@/lib/liveKitchenStore";


/** The three departments, given equal weight on the homepage. */
export default async function HomeDoors() {
  const kitchen = await loadKitchenConfig();
  const kitchenGroups = visibleKitchenGroups(kitchen.groups);
  const ticker = kitchenGroups.flatMap((group) => group.items.map((item) => item.name));
  const kitchenLine = kitchenGroups.map((group) => group.name.toLowerCase()).join(", ");
  return (
    <section aria-labelledby="home-doors-title" className="mx-auto max-w-6xl px-4 pb-2 pt-8 sm:px-6 sm:pt-10">
      <Reveal>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-600">Sweet, fresh &amp; sizzling · all under one roof</p>
        <h2 id="home-doors-title" className="royal-title mt-1 text-2xl font-bold tracking-tight text-maroon-800 sm:text-3xl">
          What would you like today?
        </h2>
      </Reveal>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Reveal>
          <Link
            href="/sweets"
            className="door-card group relative flex h-56 flex-col justify-end overflow-hidden rounded-3xl bg-maroon-900 p-5 text-cream shadow-lg shadow-maroon-900/15 md:h-80"
          >
            <Image
              src="/hero.webp"
              alt=""
              fill
              unoptimized
              sizes="(min-width: 768px) 380px, 100vw"
              className="door-photo object-cover object-[70%_center]"
            />
            <span
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(74,21,26,0.05) 20%, rgba(40,10,13,0.92) 82%)" }}
              aria-hidden
            />
            <span className="relative text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold-300">
              Since 1959
            </span>
            <span className="relative mt-1 text-2xl font-bold leading-tight">Sweets &amp; Bakery</span>
            <span className="relative mt-1 text-sm text-cream/75">Mithai, cakes, biscuits, rusk and gift packs.</span>
            <span className="relative mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-gold-500 px-4 py-1.5 text-sm font-semibold text-maroon-900">
              Shop sweets <span className="door-arrow" aria-hidden>→</span>
            </span>
          </Link>
        </Reveal>

        <Reveal delay={90}>
          <Link
            href="/general"
            className="door-card group relative flex h-56 flex-col justify-end overflow-hidden rounded-3xl bg-[#f6e7cf] p-5 text-maroon-900 shadow-lg shadow-maroon-900/10 ring-1 ring-gold-200 md:h-80"
          >
            <Image
              src="/homepage-banners-v2/general-desktop-v2.webp"
              alt=""
              fill
              unoptimized
              sizes="(min-width: 768px) 380px, 100vw"
              className="door-photo object-cover object-[78%_0%] !h-[62%]"
            />
            <span
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(255,248,240,0) 8%, rgba(255,248,240,0.9) 46%, rgba(255,248,240,0.98) 100%)" }}
              aria-hidden
            />
            <span className="relative text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold-700">
              Everyday essentials
            </span>
            <span className="relative mt-1 text-2xl font-bold leading-tight">General Store</span>
            <span className="relative mt-1 text-sm text-maroon-800/75">
              Groceries, chocolates, drinks, dairy and household items.
            </span>
            <span className="relative mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-maroon-700 px-4 py-1.5 text-sm font-semibold text-white">
              Shop general <span className="door-arrow" aria-hidden>→</span>
            </span>
          </Link>
        </Reveal>

        <Reveal delay={180}>
          <Link
            href="/live-kitchen"
            className="door-card group relative flex h-56 flex-col justify-end overflow-hidden rounded-3xl bg-[#150907] p-5 text-[#fff3e2] shadow-lg shadow-black/25 md:h-80"
          >
            <span
              className="absolute inset-0"
              style={{ background: "radial-gradient(90% 70% at 75% 20%, rgba(255,122,26,0.45), transparent 70%)" }}
              aria-hidden
            />
            <span className="kitchen-embers absolute inset-0" aria-hidden>
              {[12, 30, 48, 66, 84].map((left, i) => (
                <span key={left} style={{ left: `${left}%`, animationDelay: `${i * 1.1}s` }} />
              ))}
            </span>
            <span className="door-photo absolute -right-6 -top-6 h-40 w-40 md:-right-8 md:-top-4 md:h-56 md:w-56" aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/live-kitchen-pizza.webp?v=2" alt="" width={720} height={720} className="kitchen-spin h-full w-full drop-shadow-2xl kitchen-photo-pop" />
            </span>
            <span className="relative inline-flex w-fit items-center gap-2 rounded-full bg-[#ff7a1a] px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#2a0f08]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2a0f08]" />
              New
            </span>
            <span className="relative mt-1.5 text-2xl font-bold leading-tight">Live Kitchen</span>
            <span className="relative mt-1 text-sm text-[#fff3e2]/70">
              <span className="capitalize-first">{kitchenLine || "Hot food"}</span>, cooked to order. Daily {kitchenHoursLabel(kitchen.hours)}.
            </span>
            <span className="relative mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-[#ff9d3c] px-4 py-1.5 text-sm font-semibold text-[#2a0f08]">
              See the menu <span className="door-arrow" aria-hidden>→</span>
            </span>
          </Link>
        </Reveal>
      </div>

      <Reveal className="mt-4">
        <Link
          href="/live-kitchen"
          aria-label="Live Kitchen menu"
          className="block overflow-hidden rounded-full bg-[#150907] py-2 text-xs font-medium text-[#ffd9a8] sm:text-sm"
        >
          <span className="marquee-track" aria-hidden>
            {[...ticker, ...ticker].map((name, index) => (
              <span key={`${name}-${index}`} className="flex items-center gap-3 px-3">
                <span className="h-1 w-1 rounded-full bg-[#ff7a1a]" />
                {name}
              </span>
            ))}
          </span>
        </Link>
      </Reveal>
    </section>
  );
}
