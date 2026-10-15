"use client";

import type { MenuItem } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function ScrollProductCard({
  item,
  priority = false,
  aisleSection,
  shelf,
}: {
  item: MenuItem;
  priority?: boolean;
  aisleSection?: string;
  shelf?: "new" | "deal";
}) {
  return <ProductCard item={item} compact priority={priority} aisleSection={aisleSection} shelf={shelf} />;
}
