"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SECTIONS, isSectionSlug } from "@/lib/sections";
import { GENERAL_AISLES } from "@/lib/generalAisles";
import { BEVERAGE_AISLES } from "@/lib/beverageAisles";
import {
  applyVisibilityToggle,
  loadStoreVisibility,
  refreshStoreVisibility,
  writeStoreVisibilityFallback,
  type CategoryKind,
} from "@/lib/storeVisibility";
import {
  ADMIN_COOKIE,
  adminCookieValue,
  isAdminSession,
  verifyAdminPin,
} from "@/lib/adminAuth";
import type { AdminOrder, PaymentMethod } from "@/lib/types";
import { createSupabaseAdmin, hasSupabaseSecret } from "@/lib/supabaseAdmin";
import { refreshMenuCache } from "@/lib/loadMenu";
import { storeProductPhoto } from "@/lib/storeProductPhoto";

function refreshStorefront() {
  refreshMenuCache();
  refreshStoreVisibility();
  revalidatePath("/account");
  revalidatePath("/account/categories");
  revalidatePath("/", "layout");
  revalidatePath("/categories");
  revalidatePath("/general");
  for (const section of SECTIONS) {
    revalidatePath(`/${section.slug}`);
  }
  for (const aisle of GENERAL_AISLES) {
    revalidatePath(`/general/${aisle.slug}`);
  }
  for (const aisle of BEVERAGE_AISLES) {
    revalidatePath(`/beverage/${aisle.slug}`);
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
  const is_hidden = formData.get("is_hidden") === "on" || formData.get("is_hidden") === "true";
  const is_available = !(
    formData.get("is_out_of_stock") === "on" || formData.get("is_out_of_stock") === "true"
  );
  const description = String(formData.get("description") || "").trim() || null;
  const category_id = String(formData.get("category_id") || "").trim();

  if (!id || !name || Number.isNaN(price) || price < 0) {
    return { error: "Name aur valid price zaroori hain." };
  }
  if (!isSectionSlug(category_id)) {
    return { error: "Category galat hai." };
  }

  const supabase = createSupabaseAdmin();
  const photo = await storeProductPhoto(formData);
  if (photo.error) return { error: photo.error };

  const payload: Record<string, unknown> = {
    name,
    price,
    is_available,
    is_hidden,
    description,
    category_id,
  };
  if (photo.url) payload.image_url = photo.url;
  let { error } = await supabase.from("menu_items").update(payload).eq("id", id);

  if (error && /is_hidden/i.test(error.message)) {
    if (is_hidden) {
      return {
        error:
          "Hide ke liye Supabase SQL Editor mein data/menu-hidden.sql chalao, phir dubara save karo.",
      };
    }
    const { is_hidden: _hidden, ...withoutHidden } = payload;
    const retry = await supabase.from("menu_items").update(withoutHidden).eq("id", id);
    error = retry.error;
  }

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

  if (!name || Number.isNaN(price) || price < 0) {
    return { error: "Name aur valid price zaroori hain." };
  }
  if (!isSectionSlug(category_id)) {
    return { error: "Category select karo." };
  }

  const photo = await storeProductPhoto(formData);
  if (photo.error) return { error: photo.error };

  const supabase = createSupabaseAdmin();
  const { data: last } = await supabase
    .from("menu_items")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const id = `item-${Date.now()}`;
  const row = {
    id,
    name,
    price,
    category_id,
    description,
    image_url: photo.url ?? null,
    is_available: true,
    is_hidden: false,
    sort_order: (last?.sort_order ?? 0) + 1,
  };
  let { error } = await supabase.from("menu_items").insert(row);
  if (error && /is_hidden/i.test(error.message)) {
    const { is_hidden: _hidden, ...withoutHidden } = row;
    const retry = await supabase.from("menu_items").insert(withoutHidden);
    error = retry.error;
  }

  if (error) return { error: error.message };
  refreshStorefront();
  return { error: "" };
}

export async function setCategoryHidden(formData: FormData) {
  await requireAdmin();
  if (!hasSupabaseSecret()) {
    return { error: "SUPABASE_SECRET_KEY missing hai." };
  }

  const kind = String(formData.get("kind") || "") as CategoryKind;
  const slug = String(formData.get("slug") || "").trim();
  const hidden = String(formData.get("hidden") || "") === "true";

  if (kind !== "section" && kind !== "aisle") {
    return { error: "Category kind galat hai." };
  }
  if (kind === "section" && !isSectionSlug(slug)) {
    return { error: "Section galat hai." };
  }
  if (
    kind === "aisle" &&
    !GENERAL_AISLES.some((aisle) => aisle.slug === slug) &&
    !BEVERAGE_AISLES.some((aisle) => aisle.slug === slug)
  ) {
    return { error: "Aisle galat hai." };
  }

  const next = applyVisibilityToggle(await loadStoreVisibility(), kind, slug, hidden);

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("store_visibility").upsert(
    { kind, slug, hidden },
    { onConflict: "kind,slug" }
  );

  if (error) {
    if (/store_visibility|schema cache|does not exist|relation/i.test(error.message)) {
      try {
        await writeStoreVisibilityFallback(next);
        refreshStorefront();
        return { error: "" };
      } catch {
        return {
          error:
            "Category hide/show ke liye Supabase SQL Editor mein data/store-visibility.sql chalao, phir dubara save karo.",
        };
      }
    }
    return { error: error.message };
  }

  try {
    await writeStoreVisibilityFallback(next);
  } catch {
    /* Vercel filesystem is ephemeral */
  }

  refreshStorefront();
  return { error: "" };
}

export async function loadAdminOrders(): Promise<AdminOrder[]> {
  if (!(await isAdminSession()) || !hasSupabaseSecret()) return [];
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, phone, address, location, payment_method, notes, total, created_at, order_items(item_name, quantity, unit_price)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    order_number: row.order_number ?? null,
    created_at: row.created_at,
    customer_name: row.customer_name ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    location: row.location ?? "",
    payment_method: (row.payment_method as PaymentMethod) || "cod",
    notes: row.notes ?? "",
    total: Number(row.total ?? 0),
    items: ((row.order_items ?? []) as { item_name: string; quantity: number; unit_price: number }[]).map(
      (item) => ({
        name: item.item_name,
        quantity: item.quantity,
        unit_price: Number(item.unit_price ?? 0),
      })
    ),
  }));
}
