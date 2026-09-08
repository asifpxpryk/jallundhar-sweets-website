import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "jallundhar_admin";

function pinConfigured() {
  return Boolean(process.env.ADMIN_PIN?.trim());
}

function expectedToken() {
  const pin = process.env.ADMIN_PIN?.trim();
  if (!pin) return null;
  return createHmac("sha256", pin).update("jallundhar-admin-v1").digest("hex");
}

function tokensEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isAdminPinConfigured() {
  return pinConfigured();
}

export async function isAdminSession() {
  const token = expectedToken();
  if (!token) return false;
  const cookie = cookies().get(COOKIE)?.value;
  if (!cookie) return false;
  return tokensEqual(cookie, token);
}

export function verifyAdminPin(pin: string) {
  const expected = process.env.ADMIN_PIN?.trim();
  if (!expected) return false;
  return tokensEqual(
    createHmac("sha256", "pin-compare").update(pin).digest("hex"),
    createHmac("sha256", "pin-compare").update(expected).digest("hex")
  );
}

export function adminCookieValue() {
  return expectedToken();
}

export const ADMIN_COOKIE = COOKIE;
