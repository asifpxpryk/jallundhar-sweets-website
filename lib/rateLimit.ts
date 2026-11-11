import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * Small fixed-window rate limiter with a lock-out.
 *
 * State lives in a private Supabase Storage bucket (same approach as site visits), because
 * serverless functions do not share memory. Without the secret key (local dev) or if storage
 * fails, it falls back to this instance's memory, which still slows a single attacker down.
 */

const BUCKET = "rate-limits";

export type RateRule = {
  /** How many hits are allowed inside one window. */
  limit: number;
  windowMs: number;
  /** How long to refuse once the limit is passed. */
  lockMs: number;
};

export type RateResult = { allowed: boolean; retryAfterSec: number };

type State = { count: number; windowStart: number; lockedUntil: number };

const memory = new Map<string, State>();
let bucketReady = false;

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !secret) return null;
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

function objectName(key: string) {
  return `${createHash("sha256").update(key).digest("hex")}.json`;
}

function parseState(raw: unknown): State | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<State>;
  if (typeof value.count !== "number" || typeof value.windowStart !== "number") return null;
  return {
    count: value.count,
    windowStart: value.windowStart,
    lockedUntil: typeof value.lockedUntil === "number" ? value.lockedUntil : 0,
  };
}

async function readState(key: string): Promise<State | null> {
  const local = memory.get(key) ?? null;
  const supabase = client();
  if (!supabase) return local;
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(objectName(key));
    if (error || !data) return local;
    const remote = parseState(JSON.parse(await data.text()));
    if (!remote) return local;
    // Trust whichever copy is stricter.
    if (local && local.lockedUntil > remote.lockedUntil) return local;
    return remote;
  } catch {
    return local;
  }
}

async function writeState(key: string, state: State) {
  memory.set(key, state);
  if (memory.size > 5000) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
  const supabase = client();
  if (!supabase) return;
  try {
    if (!bucketReady) {
      const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
      if (error && !/already exists/i.test(error.message)) return;
      bucketReady = true;
    }
    await supabase.storage.from(BUCKET).upload(objectName(key), JSON.stringify(state), {
      contentType: "application/json",
      upsert: true,
    });
  } catch {
    // Memory copy is still in place.
  }
}

function retryAfter(state: State, now: number) {
  return Math.max(1, Math.ceil((state.lockedUntil - now) / 1000));
}

/** Whether `key` is currently locked out. Does not count as a hit. */
export async function rateStatus(key: string): Promise<RateResult> {
  const now = Date.now();
  const state = await readState(key);
  if (state && state.lockedUntil > now) return { allowed: false, retryAfterSec: retryAfter(state, now) };
  return { allowed: true, retryAfterSec: 0 };
}

/** Records one hit for `key`. Returns allowed=false once the rule's limit is passed. */
export async function rateHit(key: string, rule: RateRule): Promise<RateResult> {
  const now = Date.now();
  const previous = await readState(key);
  if (previous && previous.lockedUntil > now) {
    return { allowed: false, retryAfterSec: retryAfter(previous, now) };
  }
  const fresh = !previous || now - previous.windowStart >= rule.windowMs;
  const state: State = {
    count: fresh ? 1 : previous.count + 1,
    windowStart: fresh ? now : previous.windowStart,
    lockedUntil: 0,
  };
  if (state.count > rule.limit) {
    state.lockedUntil = now + rule.lockMs;
    await writeState(key, state);
    return { allowed: false, retryAfterSec: retryAfter(state, now) };
  }
  await writeState(key, state);
  return { allowed: true, retryAfterSec: 0 };
}

export async function rateReset(key: string) {
  await writeState(key, { count: 0, windowStart: Date.now(), lockedUntil: 0 });
}

/** Caller's IP as reported by the hosting proxy. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

export function waitMessage(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? "about a minute" : `${minutes} minutes`;
}
