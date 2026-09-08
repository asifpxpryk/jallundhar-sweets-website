"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SECTIONS, isSectionSlug } from "@/lib/sections";
import {
  ADMIN_COOKIE,
  adminCookieValue,
  isAdminSession,
  verifyAdminPin,
} from "@/lib/adminAuth";
import { createSupabaseAdmin, hasSupabaseSecret } from "@/lib/supabaseAdmin";
import { refreshMenuCache } from "@/lib/loadMenu";

function refreshStorefront() {
  refreshMenuCache();
  revalidatePath("/account");
  revalidatePath("/", "layout");
  for (const section of SECTIONS) {
    revalidatePath(`/${section.slug}`);
  }
}

async function requireAdmin() {
  if (!(await isAdminSession())) {
    throw new Error("Admin login required");
  }
}

export async function loginAdmin(_prev: { error?: string } | null, formData: FormData) {
  const pin = String(formData.get("pin") || "");
  if (!verifyAdminPin(pin)) {
    return { error: "Galat PIN. Dubara try karo." };
  }
  const token = adminCookieValue();
  if (!token) {
    return { error: "ADMIN_PIN .env.local mein set nahi hai." };
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

export async function logoutAdmin() {
  cookies().set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  redirect("/account");
}

export async function saveMenuItem(formData: FormData) {
  await requireAdmin();
  if (!hasSupabaseSecret()) {
    return { error: "SUPABASE_SECRET_KEY missing hai." };
  }

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price"));
  const is_available = formData.get("is_available") === "on" || formData.get("is_available") === "true";
  const description = String(formData.get("description") || "").trim() || null;
  const category_id = String(formData.get("category_id") || "").trim();

  if (!id || !name || Number.isNaN(price) || price < 0) {
    return { error: "Name aur valid price zaroori hain." };
  }
  if (!isSectionSlug(category_id)) {
    return { error: "Category galat hai." };
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("menu_items")
    .update({ name, price, is_available, description, category_id })
    .eq("id", id);

  if (error) return { error: error.message };
  refreshStorefront();
  return { error: "" };
}

export async function addMenuItem(formData: FormData) {
  await requireAdmin();
  if (!hasSupabaseSecret()) {
    return { error: "SUPABASE_SECRET_KEY missing hai." };
  }

  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price"));
  const category_id = String(formData.get("category_id") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const image_url = String(formData.get("image_url") || "").trim() || null;

  if (!name || Number.isNaN(price) || price < 0) {
    return { error: "Name aur valid price zaroori hain." };
  }
  if (!isSectionSlug(category_id)) {
    return { error: "Category select karo." };
  }

  const supabase = createSupabaseAdmin();
  const { data: last } = await supabase
    .from("menu_items")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const id = `item-${Date.now()}`;
  const { error } = await supabase.from("menu_items").insert({
    id,
    name,
    price,
    category_id,
    description,
    image_url,
    is_available: true,
    sort_order: (last?.sort_order ?? 0) + 1,
  });

  if (error) return { error: error.message };
  refreshStorefront();
  return { error: "" };
}

export async function toggleAvailable(id: string, is_available: boolean) {
  await requireAdmin();
  if (!hasSupabaseSecret()) {
    return { error: "SUPABASE_SECRET_KEY missing hai." };
  }
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("menu_items").update({ is_available }).eq("id", id);
  if (error) return { error: error.message };
  refreshStorefront();
  return { error: "" };
}
