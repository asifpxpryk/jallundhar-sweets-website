"use server";

import { isAdminSession } from "@/lib/adminAuth";
import { parseKitchenConfig } from "@/lib/liveKitchen";
import { saveKitchenConfig } from "@/lib/liveKitchenStore";
import { storeProductPhoto } from "@/lib/storeProductPhoto";
import { hasSupabaseSecret } from "@/lib/supabaseAdmin";

export async function saveLiveKitchen(json: string): Promise<{ error: string }> {
  if (!(await isAdminSession())) return { error: "Admin login required." };
  if (json.length > 200_000) return { error: "Menu is too large." };

  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { error: "Could not read the menu." };
  }
  const config = parseKitchenConfig(raw);
  if (!config) return { error: "Could not read the menu." };

  for (const group of config.groups) {
    for (const item of group.items) {
      const prices = item.sizes ? item.sizes.map((size) => size.price) : [item.price ?? 0];
      if (!item.hidden && prices.some((price) => price <= 0)) {
        return { error: `Enter a price for "${item.name}" (or hide it).` };
      }
    }
  }

  const saved = await saveKitchenConfig(config);
  return { error: saved.error ?? "" };
}

export async function uploadKitchenPhoto(formData: FormData): Promise<{ url?: string; error?: string }> {
  if (!(await isAdminSession())) return { error: "Admin login required." };
  if (!hasSupabaseSecret()) return { error: "Photo upload needs SUPABASE_SECRET_KEY on the server." };
  const stored = await storeProductPhoto(formData);
  if (stored.error) return { error: stored.error };
  if (!stored.url) return { error: "Choose a photo first." };
  return { url: stored.url };
}
