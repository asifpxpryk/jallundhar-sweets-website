"use client";

import { trackAddToCart } from "@/lib/metaPixel";
import {
  HALF_KG_STEP,
  MAX_WEIGHT_STEPS,
  ONE_KG_STEPS,
  weighedCartLine,
  weightLabel,
} from "@/lib/sweetWeight";
import type { MenuItem } from "@/lib/types";
import { useCart } from "./CartContext";

type Appearance = "card" | "detail" | "inline";

const BUTTON_STYLE: Record<Appearance, string> = {
  card: "min-h-11 rounded-xl text-[13px] sm:text-sm",
  detail: "min-h-12 rounded-xl px-5 text-sm",
  inline: "rounded-full px-2.5 py-1 text-xs",
};

const ROW_STYLE: Record<Appearance, string> = {
  card: "mt-3 grid w-full grid-cols-2 gap-2",
  detail: "grid grid-cols-2 gap-2",
  inline: "flex shrink-0 gap-1",
};

/** "500 g" and "1 kg" buttons for loose mithai; each tap adds that much to one cart line. */
export default function SweetWeightButtons({
  line,
  appearance = "card",
}: {
  /** Shopper line: id, display name and per-kg price. */
  line: MenuItem;
  appearance?: Appearance;
}) {
  const { addMany, lines } = useCart();
  const inCart = lines.find((entry) => entry.id === line.id);
  const steps = inCart?.weighed ? inCart.quantity : 0;
  const shortName = weighedCartLine(line, HALF_KG_STEP).name;

  if (line.is_available === false) {
    return (
      <button
        type="button"
        disabled
        className={`${BUTTON_STYLE[appearance]} ${appearance === "card" ? "mt-3 w-full" : ""} cursor-not-allowed bg-maroon-200 font-semibold text-maroon-800/70`}
      >
        Out of stock
      </button>
    );
  }

  function addWeight(wanted: number) {
    const added = Math.min(wanted, MAX_WEIGHT_STEPS - steps);
    if (added <= 0) return;
    const cartLine = weighedCartLine(line, added);
    addMany([cartLine]);
    trackAddToCart({
      content_ids: [String(cartLine.id)],
      content_name: cartLine.name,
      value: cartLine.price * added,
      contents: [{ id: String(cartLine.id), quantity: added, item_price: cartLine.price }],
    });
  }

  return (
    <div className={`relative ${ROW_STYLE[appearance]}`}>
      {[HALF_KG_STEP, ONE_KG_STEPS].map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => addWeight(size)}
          aria-label={`Add ${weightLabel(size)} ${shortName} to cart`}
          className={`${BUTTON_STYLE[appearance]} whitespace-nowrap bg-maroon-800 font-semibold text-white transition hover:bg-maroon-900 active:translate-y-px`}
        >
          + {weightLabel(size)}
        </button>
      ))}
      {steps > 0 ? (
        <span
          aria-live="polite"
          aria-label={`${shortName} in cart ${weightLabel(steps)}`}
          className="pointer-events-none absolute -right-1 -top-2 flex h-5 min-w-5 items-center justify-center whitespace-nowrap rounded-full bg-gold-500 px-1.5 text-[11px] font-bold leading-none text-maroon-900 ring-2 ring-white"
        >
          {weightLabel(steps)}
        </span>
      ) : null}
    </div>
  );
}
