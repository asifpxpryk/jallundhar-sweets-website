import { cache } from "react";
import { onProductPage } from "@/lib/menuScope";

/**
 * React's per-request `cache`, kept apart for the two copies of the menu (see menuScope.ts). A product
 * page can switch to the listings' copy part-way through a request; without this, a value read from the
 * snapshot before the switch would be handed back afterwards as if it were current.
 */
export function scopedMemo<Args extends unknown[], Result>(load: (...args: Args) => Result): (...args: Args) => Result {
  const memo = cache((_snapshot: boolean, ...args: Args) => load(...args));
  return (...args: Args) => memo(onProductPage(), ...args);
}
