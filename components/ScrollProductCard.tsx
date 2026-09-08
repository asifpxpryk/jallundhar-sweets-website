"use client";

import type { MenuItem } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function ScrollProductCard({
  item,
  priority = false,
}: {
  item: MenuItem;
  priority?: boolean;
}) {
  return <ProductCard item={item} compact priority={priority} />;
}
