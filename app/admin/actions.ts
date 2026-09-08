"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SECTIONS, isSectionSlug } from "@/lib/sections";
import { GENERAL_AISLES } from "@/lib/generalAisles";
import { BEVERAGE_AISLES } from "@/lib/beverageAisles";
import {
  applyVisibilityToggle,
  itemVisibilitySlug,
  loadStoreVisibility,
  refreshStoreVisibility,
  visibilityConfigRow,
  writeStoreVisibilityFallback,
  type CategoryKind,
} from "@/lib/storeVisibility";
import {
  ADMIN_COOKIE,
  ADMIN_UI_COOKIE,
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

function isMissingHiddenColumn(message: string) {
  return /is_hidden/i.test(message);
}

function isMissingVisibilityTable(message: string) {
  return /store_visibility|schema cache|does not exist|relation/i.test(message);
}

async function writeVisibilityConfig(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  vis: Awaited<ReturnType<typeof loadStoreVisibility>>
) {
  try {
    await writeStoreVisibilityFallback(vis);
  } catch {
    /* Vercel filesystem is ephemeral */
  }
  return supabase.from("menu_items").upsert(visibilityConfigRow(vis), { onConflict: "id" });
}

async function syncItemHiddenFlag(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  id: string,
  hidden: boolean,
  columnExists: boolean
) {
  const slug = itemVisibilitySlug(id);
  const vis = applyVisibilityToggle(await loadStoreVisibility(), "aisle", slug, columnExists ? false : hidden);

  if (columnExists) {
    await writeVisibilityConfig(supabase, vis);
    return;
  }

  const { error } = await supabase.from("store_visibility").upsert(
    { kind: "aisle", slug, hidden },
    { onConflict: "kind,slug" }
  );

  if (!error) {
    try {
      await writeStoreVisibilityFallback(vis);
    } catch {
      /* Vercel filesystem is ephemeral */
    }
    return;
  }

  if (!isMissingVisibilityTable(error.message)) {
    throw new Error(error.message);
  }

  const written = await writeVisibilityConfig(supabase, vis);
  if (written.error && hidden) {
    throw new Error(written.error.message);
  }
}

export async function loginAdmin(_prev: { error?: string } | null, formData: FormData) {
  const pin = String(formData.get("pin") || "");
  if (!verifyAdminPin(pin)) {
    return { error: "Wrong PIN. Please try again." };
  }
  const token = adminCookieValue();
  if (!token) {
    return { error: "ADMIN_PIN is not set in .env.local." };
  }
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
    secure: process.env.NODE_ENV === "production",
  });
  cookies().set(ADMIN_UI_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/account");
}

export async function logoutAdmin() {
  cookies().set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  cookies().set(ADMIN_UI_COOKIE, "", { httpOnly: false, path: "/", maxAge: 0 });
  redirect("/");
}

export async function saveMenuItem(formData: FormData) {
  await requireAdmin();
  if (!hasSupabaseSecret()) {
    return { error: "SUPABASE_SECRET_KEY is missing." };
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
    return { error: "Name and a valid price are required." };
  }
  if (!isSectionSlug(category_id)) {
    return { error: "Category is invalid." };
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
  let columnExists = true;
  let { error } = await supabase.from("menu_items").update(payload).eq("id", id);

  if (error && isMissingHiddenColumn(error.message)) {
    columnExists = false;
    const { is_hidden: _hidden, ...withoutHidden } = payload;
    const retry = await supabase.from("menu_items").update(withoutHidden).eq("id", id);
    error = retry.error;
  }

  if (error) return { error: error.message };
  try {
    await syncItemHiddenFlag(supabase, id, is_hidden, columnExists);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not hide this item." };
  }
  refreshStorefront();
  return { error: "" };
}

export async function saveStorefrontItem(formData: FormData) {
  await requireAdmin();
  if (!hasSupabaseSecret()) {
    return { error: "SUPABASE_SECRET_KEY is missing." };
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
  const image_url = String(formData.get("image_url") || "").trim() || null;

  if (!id || !name || Number.isNaN(price) || price < 0) {
    return { error: "A valid price is required." };
  }
  if (!isSectionSlug(category_id)) {
    return { error: "Category is invalid." };
  }

  const supabase = createSupabaseAdmin();
  const payload: Record<string, unknown> = {
    name,
    price,
    is_available,
    is_hidden,
    description,
    category_id,
  };

  let columnExists = true;
  let { data, error } = await supabase.from("menu_items").update(payload).eq("id", id).select("id");

  if (error && isMissingHiddenColumn(error.message)) {
    columnExists = false;
    const { is_hidden: _hidden, ...withoutHidden } = payload;
    const retry = await supabase.from("menu_items").update(withoutHidden).eq("id", id).select("id");
    error = retry.error;
    data = retry.data;
  }

  if (error) return { error: error.message };

  if (!data?.length) {
    const insertRow: Record<string, unknown> = {
      id,
      ...payload,
      image_url,
      sort_order: 0,
    };
    let inserted = await supabase.from("menu_items").insert(insertRow);
    if (inserted.error && isMissingHiddenColumn(inserted.error.message)) {
      columnExists = false;
      const { is_hidden: _hidden, ...withoutHidden } = insertRow;
      inserted = await supabase.from("menu_items").insert(withoutHidden);
    }
    if (inserted.error) return { error: inserted.error.message };
  }

  try {
    await syncItemHiddenFlag(supabase, id, is_hidden, columnExists);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not hide this item." };
  }

  refreshStorefront();
  return { error: "" };
}

export async function addMenuItem(formData: FormData) {
  await requireAdmin();
  if (!hasSupabaseSecret()) {
    return { error: "SUPABASE_SECRET_KEY is missing." };
  }

  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price"));
  const category_id = String(formData.get("category_id") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;

  if (!name || Number.isNaN(price) || price < 0) {
    return { error: "Name and a valid price are required." };
  }
  if (!isSectionSlug(category_id)) {
    return { error: "Please select a category." };
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
  let columnExists = true;
  let { error } = await supabase.from("menu_items").insert(row);
  if (error && isMissingHiddenColumn(error.message)) {
    columnExists = false;
    const { is_hidden: _hidden, ...withoutHidden } = row;
    const retry = await supabase.from("menu_items").insert(withoutHidden);
    error = retry.error;
  }

  if (error) return { error: error.message };
  try {
    await syncItemHiddenFlag(supabase, id, false, columnExists);
  } catch {
    /* new items start visible */
  }
  refreshStorefront();
  return { error: "" };
}

export async function setCategoryHidden(formData: FormData) {
  await requireAdmin();
  if (!hasSupabaseSecret()) {
    return { error: "SUPABASE_SECRET_KEY is missing." };
  }

  const kind = String(formData.get("kind") || "") as CategoryKind;
  const slug = String(formData.get("slug") || "").trim();
  const hidden = String(formData.get("hidden") || "") === "true";

  if (kind !== "section" && kind !== "aisle") {
    return { error: "Category type is invalid." };
  }
  if (kind === "section" && !isSectionSlug(slug)) {
    return { error: "Section is invalid." };
  }
  if (
    kind === "aisle" &&
    !GENERAL_AISLES.some((aisle) => aisle.slug === slug) &&
    !BEVERAGE_AISLES.some((aisle) => aisle.slug === slug)
  ) {
    return { error: "Aisle is invalid." };
  }

  const next = applyVisibilityToggle(await loadStoreVisibility(), kind, slug, hidden);

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("store_visibility").upsert(
    { kind, slug, hidden },
    { onConflict: "kind,slug" }
  );

  if (error) {
    if (/store_visibility|schema cache|does not exist|relation/i.test(error.message)) {
      const written = await writeVisibilityConfig(supabase, next);
      if (!written.error) {
        refreshStorefront();
        return { error: "" };
      }
      try {
        await writeStoreVisibilityFallback(next);
        refreshStorefront();
        return { error: "" };
      } catch {
        return { error: written.error.message };
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
