import { promises as fs } from "fs";
import path from "path";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { DEFAULT_KITCHEN_CONFIG, parseKitchenConfig, type KitchenConfig } from "@/lib/liveKitchen";
import { createSupabaseAdmin, hasSupabaseSecret } from "@/lib/supabaseAdmin";

/**
 * Where the edited Live Kitchen menu lives.
 *
 * Production: one JSON file in a public Supabase Storage bucket. The menu is public anyway,
 * so the site reads it without a key; only the admin (secret key) can write it.
 * Local dev without the secret key: data/live-kitchen.local.json, so the editor can be tried out.
 * Nothing saved yet: the defaults in lib/liveKitchen.ts.
 */
const BUCKET = "site-config";
const OBJECT = "live-kitchen.json";
const LOCAL_FILE = path.join(process.cwd(), "data", "live-kitchen.local.json");
const TAG = "live-kitchen";

const isProduction = process.env.NODE_ENV === "production";

async function readRemote(): Promise<KitchenConfig | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const response = await fetch(`${url}/storage/v1/object/public/${BUCKET}/${OBJECT}?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return parseKitchenConfig(await response.json());
  } catch {
    return null;
  }
}

async function readLocal(): Promise<KitchenConfig | null> {
  if (isProduction) return null;
  try {
    return parseKitchenConfig(JSON.parse(await fs.readFile(LOCAL_FILE, "utf8")));
  } catch {
    return null;
  }
}

export async function loadKitchenConfigUncached(): Promise<KitchenConfig> {
  return (await readLocal()) ?? (await readRemote()) ?? DEFAULT_KITCHEN_CONFIG;
}

/** Storefront copy: read once, refreshed when the admin saves. */
export const loadKitchenConfig = unstable_cache(loadKitchenConfigUncached, ["jallundhar-live-kitchen-v1"], {
  revalidate: 604800,
  tags: [TAG],
});

export async function saveKitchenConfig(config: KitchenConfig): Promise<{ error?: string }> {
  const body = `${JSON.stringify(config, null, 2)}\n`;

  if (hasSupabaseSecret()) {
    const supabase = createSupabaseAdmin();
    const created = await supabase.storage.createBucket(BUCKET, { public: true });
    if (created.error && !/already exists/i.test(created.error.message)) {
      return { error: created.error.message };
    }
    const { error } = await supabase.storage.from(BUCKET).upload(OBJECT, body, {
      contentType: "application/json",
      cacheControl: "0",
      upsert: true,
    });
    if (error) return { error: error.message };
  } else if (!isProduction) {
    await fs.writeFile(LOCAL_FILE, body);
  } else {
    return { error: "SUPABASE_SECRET_KEY is missing." };
  }

  revalidateTag(TAG);
  revalidatePath("/live-kitchen");
  revalidatePath("/");
  return {};
}
