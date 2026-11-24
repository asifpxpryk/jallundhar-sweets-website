import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * Remembers what the menu looked like at the last POS refresh, so a refresh that changed nothing
 * can be skipped. A refresh throws away every cached page (4,300 product pages), and the POS bridge
 * calls every 20 minutes whether or not a rate moved.
 *
 * The fingerprint lives in the private Storage bucket the rate limiter already uses, because
 * serverless functions do not share memory. Whenever it can't be read, the answer is "changed".
 */

const BUCKET = "rate-limits";
const OBJECT = "pos-refresh-menu-fingerprint.json";

/** A short stable signature of the menu rows the storefront reads. */
export function menuFingerprint(rows: unknown[]): string {
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

/** False only when there is a remembered fingerprint and it matches. */
export function menuChanged(current: string, remembered: string | null): boolean {
  return !remembered || remembered !== current;
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !secret) return null;
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

export async function readMenuFingerprint(): Promise<string | null> {
  const supabase = client();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(OBJECT);
    if (error || !data) return null;
    const saved = JSON.parse(await data.text()) as { fingerprint?: unknown };
    return typeof saved.fingerprint === "string" ? saved.fingerprint : null;
  } catch {
    return null;
  }
}

export async function saveMenuFingerprint(fingerprint: string) {
  const supabase = client();
  if (!supabase) return;
  try {
    await supabase.storage
      .from(BUCKET)
      .upload(OBJECT, JSON.stringify({ fingerprint, savedAt: new Date().toISOString() }), {
        contentType: "application/json",
        upsert: true,
      });
  } catch {
    // Not remembered: the next POS refresh simply runs in full.
  }
}
