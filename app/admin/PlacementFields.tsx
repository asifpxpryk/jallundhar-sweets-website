"use client";

import { useState } from "react";
import { aislesForSection, SECTION_OPTIONS } from "@/lib/placementOptions";

export default function PlacementFields({
  defaultSection,
  defaultAisle,
  compact = false,
}: {
  defaultSection: string;
  defaultAisle?: string;
  compact?: boolean;
}) {
  const [section, setSection] = useState(defaultSection);
  const aisles = aislesForSection(section);
  const aisleValue = aisles.some((aisle) => aisle.slug === defaultAisle) ? defaultAisle : "";

  return (
    <div className={compact ? "mt-2 grid gap-2" : "contents"}>
      <label className={compact ? "block text-[11px] text-maroon-800" : "text-sm text-maroon-800"}>
        Category
        <select
          name="category_id"
          value={section}
          onChange={(event) => setSection(event.target.value)}
          className={
            compact
              ? "mt-0.5 w-full rounded-lg border border-gold-200 px-2 py-1 text-sm"
              : "mt-1 w-full rounded-xl border border-gold-200 px-3 py-2"
          }
        >
          {SECTION_OPTIONS.map((entry) => (
            <option key={entry.slug} value={entry.slug}>
              {entry.name}
            </option>
          ))}
        </select>
      </label>
      <label className={compact ? "block text-[11px] text-maroon-800" : "text-sm text-maroon-800"}>
        Aisle
        <select
          name="aisle_slug"
          key={`${section}-${aisleValue}`}
          defaultValue={aisleValue}
          className={
            compact
              ? "mt-0.5 w-full rounded-lg border border-gold-200 px-2 py-1 text-sm"
              : "mt-1 w-full rounded-xl border border-gold-200 px-3 py-2"
          }
        >
          <option value="">{aisles.length ? "Section home (no aisle)" : "No aisles"}</option>
          {aisles.map((aisle) => (
            <option key={aisle.slug} value={aisle.slug}>
              {aisle.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
