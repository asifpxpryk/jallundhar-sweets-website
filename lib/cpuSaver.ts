import { createClient } from "@supabase/supabase-js";
import { revalidateTag, unstable_cache } from "next/cache";

/**
 * "CPU saver": a switch the owner flips in /account when Vercel's Fluid Active CPU allowance runs low.
 * While it is on, POS refreshes are answered without rebuilding any page and visits are not counted.
 * The rest of the site (pages, orders, admin) keeps working. Kept in a private Supabase Storage bucket
 * (same approach as lib/rateLimit.ts); a read failure counts as "off" so the site never gets stuck paused.
 */

const BUCKET = "site-switches";
const OBJECT = "cpu-saver.json";
const TAG = "cpu-saver";

export type CpuSaver = {
  on: boolean;
  /** When it was last switched (either way), ISO time; null if never. */
  changedAt: string | null;
};

const OFF: CpuSaver = { on: false, changedAt: null };

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !secret) return null;
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

export async function readCpuSaverUncached(): Promise<CpuSaver> {
  const supabase = client();
  if (!supabase) return OFF;
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(OBJECT);
    if (error || !data) return OFF;
    const raw = JSON.parse(await data.text()) as Partial<CpuSaver>;
    return {
      on: raw.on === true,
      changedAt: typeof raw.changedAt === "string" ? raw.changedAt : null,
    };
  } catch {
    return OFF;
  }
}

/** Cached until the switch is flipped (the flip drops this tag), so a check costs no storage read. */
export const readCpuSaver = unstable_cache(readCpuSaverUncached, [TAG], { tags: [TAG], revalidate: 86400 });

export async function writeCpuSaver(on: boolean): Promise<CpuSaver> {
  const supabase = client();
  if (!supabase) throw new Error("SUPABASE_SECRET_KEY is not set.");
  const value: CpuSaver = { on, changedAt: new Date().toISOString() };
  const { error: bucketError } = await supabase.storage.createBucket(BUCKET, { public: false });
  if (bucketError && !/already exists/i.test(bucketError.message)) throw new Error(bucketError.message);
  const { error } = await supabase.storage.from(BUCKET).upload(OBJECT, JSON.stringify(value), {
    contentType: "application/json",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  revalidateTag(TAG);
  return value;
}
