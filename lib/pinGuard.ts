import { headers } from "next/headers";
import { clientIp, rateHit, rateReset, rateStatus, waitMessage } from "@/lib/rateLimit";

const MINUTE = 60_000;

/** 5 wrong PINs from one address locks that address for 15 minutes. */
const PER_IP = { limit: 5, windowMs: 15 * MINUTE, lockMs: 15 * MINUTE };
/** 40 wrong PINs from anywhere in 15 minutes locks PIN login for everyone for 15 minutes (bots that rotate addresses). */
const GLOBAL = { limit: 40, windowMs: 15 * MINUTE, lockMs: 15 * MINUTE };
const GLOBAL_KEY = "pin:all";

function ipKey() {
  return `pin:ip:${clientIp(headers())}`;
}

/** Call before checking a PIN. Returns an error message when PIN login is locked. */
export async function pinLockMessage(): Promise<string | null> {
  const [own, all] = await Promise.all([rateStatus(ipKey()), rateStatus(GLOBAL_KEY)]);
  const locked = !own.allowed ? own : !all.allowed ? all : null;
  if (!locked) return null;
  return `Too many wrong PIN attempts. Try again in ${waitMessage(locked.retryAfterSec)}.`;
}

/** Call after a wrong PIN. Returns the message to show. */
export async function recordWrongPin(): Promise<string> {
  const [own, all] = await Promise.all([rateHit(ipKey(), PER_IP), rateHit(GLOBAL_KEY, GLOBAL)]);
  // A fixed pause makes every guess slow, whatever the limits say.
  await new Promise((resolve) => setTimeout(resolve, 800));
  const locked = !own.allowed ? own : !all.allowed ? all : null;
  if (locked) return `Too many wrong PIN attempts. Try again in ${waitMessage(locked.retryAfterSec)}.`;
  return "Wrong PIN.";
}

/** Call after a correct PIN so the owner's own slips do not add up. */
export async function clearPinAttempts() {
  await rateReset(ipKey());
}
