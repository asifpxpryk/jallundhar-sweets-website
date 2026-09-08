"use client";

import type { MenuItem } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function ScrollProductCard({ item }: { item: MenuItem }) {
  return <ProductCard item={item} compact />;
}
