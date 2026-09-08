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
      return { error: "Galat PIN.", ok: false };
    }
    const token = adminCookieValue();
    if (!token) {
      return { error: "ADMIN_PIN set nahi hai.", ok: false };
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
    return { error: "Phone number se login karo.", ok: false };
  }

  return { error: "", ok: true };
}
