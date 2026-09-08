"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  adminCookieValue,
  verifyAdminPin,
} from "@/lib/adminAuth";

export async function loginAccount(_prev: { error?: string } | null, formData: FormData) {
  const pin = String(formData.get("pin") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (pin) {
    if (!verifyAdminPin(pin)) {
      return { error: "Wrong PIN.", ok: false };
    }
    const token = adminCookieValue();
    if (!token) {
      return { error: "ADMIN_PIN is not set.", ok: false };
    }
    cookies().set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
      secure: process.env.NODE_ENV === "production",
    });
    redirect("/account");
  }

  if (!phone) {
    return { error: "Please log in with a phone number.", ok: false };
  }

  return { error: "", ok: true };
}
