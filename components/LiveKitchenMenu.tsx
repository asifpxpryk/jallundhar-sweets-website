"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "./CartContext";
import KitchenArt from "./KitchenArt";
import {
  isKitchenOpen,
  kitchenLineId,
  kitchenLineName,
  type KitchenGroup,
  type KitchenHours,
  type KitchenItem,
  type KitchenSize,
} from "@/lib/liveKitchen";
import type { MenuItem } from "@/lib/types";

function toCartItem(item: KitchenItem, size?: KitchenSize): MenuItem {
  return {
    id: kitchenLineId(item, size),
    category_id: "live-kitchen",
    name: kitchenLineName(item, size),
    description: item.description,
    price: size ? size.price : item.price ?? 0,
    image_url: null,
    is_available: true,
    sort_order: 0,
  };
}

const TAG_STYLE: Record<NonNullable<KitchenItem["tag"]>, string> = {
  Bestseller: "bg-gold-400 text-maroon-900",
  Spicy: "bg-[#e2452b] text-white",
  New: "bg-emerald-400 text-emerald-950",
};

function KitchenCard({ item, group, index }: { item: KitchenItem; group: KitchenGroup; index: number }) {
  const { lines, setLine, adjust } = useCart();
  const [sizeKey, setSizeKey] = useState(item.sizes ? item.sizes[1]?.key ?? item.sizes[0].key : "");
  const [pop, setPop] = useState(0);
  const size = item.sizes?.find((entry) => entry.key === sizeKey);
  const cartItem = toCartItem(item, size);
  const quantity = lines.find((line) => line.id === cartItem.id)?.quantity ?? 0;

  function addOne() {
    setLine(cartItem, quantity + 1);
    setPop((value) => value + 1);
  }

  return (
    <article
      className="kitchen-card group relative flex gap-3 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur-sm transition duration-300 hover:border-[#ff9d3c]/50 hover:bg-white/[0.08] sm:gap-4 sm:p-4"
     
    >
      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3a1a12] to-[#1c0c09] sm:h-28 sm:w-28">
        <span className="kitchen-glow absolute inset-2 rounded-full bg-[#ff7a1a]/25 blur-xl" aria-hidden />
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            width={480}
            height={480}
            loading="lazy"
            className="kitchen-art relative h-[5.5rem] w-[5.5rem] object-contain drop-shadow-xl sm:h-[6.5rem] sm:w-[6.5rem]"
          />
        ) : (
          <KitchenArt kind={group.key} className="kitchen-art relative h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20" />
        )}
        {item.tag ? (
          <span
            className={`absolute -left-1 -top-1 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide shadow ${TAG_STYLE[item.tag]}`}
          >
            {item.tag}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-[0.95rem] font-semibold leading-snug text-[#fff3e2] sm:text-base">{item.name}</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-[#fff3e2]/60">{item.description}</p>

        {item.sizes ? (
          <div
            role="radiogroup"
            aria-label={`${item.name} size`}
            className="mt-2 flex w-full rounded-full bg-black/30 p-0.5 ring-1 ring-white/10"
          >
            {item.sizes.map((entry) => {
              const active = entry.key === sizeKey;
              return (
                <button
                  key={entry.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSizeKey(entry.key)}
                  className={`min-w-0 flex-1 rounded-full px-1.5 py-1 text-center text-[0.7rem] font-semibold transition ${
                    active ? "bg-[#ff9d3c] text-[#2a0f08] shadow" : "text-[#fff3e2]/70 hover:text-white"
                  }`}
                >
                  {entry.label}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <p key={cartItem.id} className="kitchen-price text-base font-bold text-[#ffc46b] sm:text-lg">
            Rs. {cartItem.price.toLocaleString()}
          </p>
          {quantity > 0 ? (
            <div className="flex items-center gap-1 rounded-full bg-[#ff9d3c] p-0.5 text-[#2a0f08] shadow-lg shadow-[#ff7a1a]/20">
              <button
                type="button"
                aria-label={`Remove one ${cartItem.name}`}
                onClick={() => adjust(cartItem.id, -1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold transition hover:bg-black/10"
              >
                −
              </button>
              <span key={`${quantity}-${pop}`} className="kitchen-pop min-w-[1.25rem] text-center text-sm font-bold">
                {quantity}
              </span>
              <button
                type="button"
                aria-label={`Add one more ${cartItem.name}`}
                onClick={addOne}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold transition hover:bg-black/10"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={addOne}
              className="rounded-full bg-[#ff9d3c] px-4 py-2 text-xs font-bold text-[#2a0f08] shadow-lg shadow-[#ff7a1a]/20 transition hover:bg-[#ffb35f] active:scale-95 sm:text-sm"
            >
              Add +
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function LiveKitchenMenu({
  menu,
  hours,
  hoursLabel,
}: {
  menu: KitchenGroup[];
  hours: KitchenHours;
  hoursLabel: string;
}) {
  const { lines, openCheckout } = useCart();
  const [open, setOpen] = useState<boolean | null>(null);
  const [active, setActive] = useState<string>(menu[0]?.key ?? "");

  useEffect(() => {
    const update = () => setOpen(isKitchenOpen(hours));
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [hours]);

  useEffect(() => {
    const sections = menu.map((group) => document.getElementById(`lk-${group.key}`)).filter(
      (node): node is HTMLElement => node !== null
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id.replace(/^lk-/, ""));
        }
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [menu]);

  const kitchenLines = useMemo(() => lines.filter((line) => line.id.startsWith("lk-")), [lines]);
  const kitchenCount = kitchenLines.reduce((sum, line) => sum + line.quantity, 0);
  const kitchenTotal = kitchenLines.reduce((sum, line) => sum + line.quantity * line.price, 0);

  return (
    <div className="live-kitchen relative bg-[#150907] text-[#fff3e2]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="kitchen-embers pointer-events-none absolute inset-0" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * 0.7) % 6}s`, animationDuration: `${5 + (i % 5)}s` }} />
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-56"
          style={{ background: "radial-gradient(60% 100% at 50% 100%, rgba(255,122,26,0.35), transparent 70%)" }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="lk-rise inline-flex items-center gap-2 rounded-full border border-[#ff9d3c]/40 bg-[#ff9d3c]/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#ffb35f]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff7a1a] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff7a1a]" />
              </span>
              New · Live Kitchen
            </p>
            <h1 className="lk-rise mt-3 text-[2rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl" style={{ animationDelay: "80ms" }}>
              Hot. Fresh.
              <br />
              <span className="bg-gradient-to-r from-[#ffc46b] via-[#ff9d3c] to-[#ff5a1f] bg-clip-text text-transparent">
                Fired up, just for you.
              </span>
            </h1>
            <p className="lk-rise mt-3 max-w-md text-sm leading-relaxed text-[#fff3e2]/70 sm:text-base" style={{ animationDelay: "160ms" }}>
              Straight off the flame and onto your plate. Bold desi flavours and melting cheese.
            </p>
            <div className="lk-rise mt-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm" style={{ animationDelay: "240ms" }}>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-semibold ring-1 ${
                  open === null
                    ? "bg-white/5 text-[#fff3e2]/70 ring-white/10"
                    : open
                    ? "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30"
                    : "bg-white/5 text-[#fff3e2]/70 ring-white/15"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${open ? "bg-emerald-400" : "bg-[#fff3e2]/40"}`} />
                {open === null ? "Kitchen hours" : open ? "Kitchen is open now" : "Kitchen is closed right now"}
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1.5 text-[#fff3e2]/80 ring-1 ring-white/10">
                Daily {hoursLabel}
              </span>
            </div>
          </div>

          <div className="lk-rise absolute right-3 top-5 h-[5.5rem] w-[5.5rem] md:relative md:right-auto md:top-auto md:mx-auto md:h-64 md:w-64 lg:h-72 lg:w-72" style={{ animationDelay: "200ms" }} aria-hidden>
            <span className="absolute inset-0 rounded-full bg-[#ff7a1a]/30 blur-3xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/live-kitchen-pizza.webp?v=2" alt="" width={720} height={720} className="kitchen-spin relative h-full w-full drop-shadow-2xl kitchen-photo-pop" />
            <span className="kitchen-steam left-[30%]" />
            <span className="kitchen-steam left-[50%]" style={{ animationDelay: "0.8s" }} />
            <span className="kitchen-steam left-[68%]" style={{ animationDelay: "1.6s" }} />
          </div>
        </div>
      </section>

      {/* Group chips */}
      <nav
        aria-label="Live Kitchen menu sections"
        className="sticky top-[60px] z-30 border-y border-white/10 bg-[#150907]/90 backdrop-blur"
      >
        <div className="scrollbar-hide mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
          {menu.map((group) => (
            <a
              key={group.key}
              href={`#lk-${group.key}`}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                active === group.key
                  ? "bg-[#ff9d3c] text-[#2a0f08]"
                  : "bg-white/5 text-[#fff3e2]/75 ring-1 ring-white/10 hover:bg-white/10"
              }`}
            >
              <KitchenArt kind={group.key} className="h-5 w-5" />
              {group.name}
              <span className={`text-xs font-normal ${active === group.key ? "opacity-70" : "opacity-50"}`}>
                {group.items.length}
              </span>
            </a>
          ))}
        </div>
      </nav>

      {/* Menu */}
      <div className={`mx-auto max-w-6xl space-y-10 px-4 pt-8 sm:px-6 sm:pt-10 ${kitchenCount > 0 ? "pb-24" : "pb-8 sm:pb-10"}`}>
        {menu.map((group) => (
          <section key={group.key} id={`lk-${group.key}`} className="scroll-mt-32">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">{group.name}</h2>
                <p className="text-sm text-[#fff3e2]/60">{group.tagline}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {group.items.map((item, index) => (
                <KitchenCard key={item.id} item={item} group={group} index={index} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Order bar */}
      {kitchenCount > 0 ? (
        <div className="kitchen-bar fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-white/10 bg-[#150907]/95 px-3 py-2 backdrop-blur xl:bottom-0">
          <button
            type="button"
            onClick={openCheckout}
            className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-[#25d366] py-2.5 pl-4 pr-2.5 text-left font-semibold text-[#06310f] transition hover:bg-[#3be07a] active:scale-[0.98]"
          >
            <span className="flex items-center gap-2 text-sm">
              <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-[#06310f] px-1.5 text-xs font-bold text-white">
                {kitchenCount}
              </span>
              Rs. {kitchenTotal.toLocaleString()}
            </span>
            <span className="flex items-center gap-2 rounded-full bg-[#06310f] px-3.5 py-1.5 text-sm text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5Z" />
              </svg>
              Order on WhatsApp
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
