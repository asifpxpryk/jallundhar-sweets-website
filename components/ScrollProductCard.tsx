"use client";

import type { MenuItem } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function ScrollProductCard({
  item,
  priority = false,
  aisleSection,
}: {
  item: MenuItem;
  priority?: boolean;
  aisleSection?: string;
}) {
  return <ProductCard item={item} compact priority={priority} aisleSection={aisleSection} />;
}
