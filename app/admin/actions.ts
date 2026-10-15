"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SECTIONS } from "@/lib/sections";
import { GENERAL_AISLES } from "@/lib/generalAisles";
import { BEVERAGE_AISLES } from "@/lib/beverageAisles";
import { BAKERY_AISLES } from "@/lib/bakeryAisles";
import { SWEETS_AISLES } from "@/lib/sweetsAisles";
import {
  aisleSlugTaken,
  categoryKey,
  isKnownAisle,
  isKnownSection,
  isReservedSectionSlug,
  listAisles,
  listSections,
  uniqueCategorySlug,
} from "@/lib/categoryCatalog";
import {
  applyBestsellerToggle,
  applyDealToggle,
  applyNewArrivalToggle,
  applyItemPlacement,
  applyVisibilityToggle,
  itemVisibilitySlug,
  loadStoreVisibilityUncached,
  refreshStoreVisibility,
  visibilityConfigRow,
  writeStoreVisibilityFallback,
  type CategoryKind,
  type StoreVisibility,
} from "@/lib/storeVisibility";
import { isValidPlacement, placementKey } from "@/lib/placementOptions";
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
import { bannerOptions, bannerPageOptions } from "@/lib/bannerCatalog";

async function refreshStorefront() {
  refreshMenuCache();
  refreshStoreVisibility();
  revalidatePath("/account");
  revalidatePath("/account/categories");
  revalidatePath("/account/banners");
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
  for (const aisle of BAKERY_AISLES) {
    revalidatePath(`/bakery/${aisle.slug}`);
  }
  for (const aisle of SWEETS_AISLES) {
    revalidatePath(`/sweets/${aisle.slug}`);
  }
  try {
    const vis = await loadStoreVisibilityUncached();
    for (const section of listSections(vis)) {
      revalidatePath(section.href);
      for (const aisle of listAisles(vis, section.slug)) revalidatePath(aisle.href);
    }
  } catch {
    /* Builtin paths above are already refreshed. */
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
  vis: StoreVisibility
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
  columnExists: boolean,
  is_bestseller = false,
  catalogId = id,
  relatedIds: string[] = [],
  shelf?: { is_new_arrival?: boolean; is_deal?: boolean; deal_label?: string }
) {
  const ids = [...new Set([id, catalogId, ...relatedIds].filter(Boolean))];
  let vis = await loadStoreVisibilityUncached();
  for (const itemId of ids) {
    vis = applyVisibilityToggle(vis, "aisle", itemVisibilitySlug(itemId), hidden);
  }
  vis = applyBestsellerToggle(vis, catalogId, is_bestseller);
  if (shelf && typeof shelf.is_new_arrival === "boolean") {
    vis = applyNewArrivalToggle(vis, catalogId, shelf.is_new_arrival);
  }
  if (shelf && typeof shelf.is_deal === "boolean") {
    vis = applyDealToggle(vis, catalogId, shelf.is_deal, shelf.deal_label ?? "");
  }

  if (!columnExists) {
    for (const itemId of ids) {
      const { error } = await supabase.from("store_visibility").upsert(
        { kind: "aisle", slug: itemVisibilitySlug(itemId), hidden },
        { onConflict: "kind,slug" }
      );
      if (error && !isMissingVisibilityTable(error.message)) {
        throw new Error(error.message);
      }
    }
  }

  const written = await writeVisibilityConfig(supabase, vis);
  if (written.error && (hidden || is_bestseller || shelf?.is_new_arrival || shelf?.is_deal)) {
    throw new Error(written.error.message);
  }
}

async function placementError(section: string, aisle: string) {
  const vis = await loadStoreVisibilityUncached();
  if (!isKnownSection(vis, section)) return "Please select a category.";
  if (!isValidPlacement(section, aisle, vis)) return "Category or aisle is invalid.";
  return "";
}

async function persistItemPlacement(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  ids: string[],
  section: string,
  aisle: string
) {
  const current = await loadStoreVisibilityUncached();
  if (!isValidPlacement(section, aisle, current)) {
    throw new Error("Category or aisle is invalid.");
  }
  const vis = applyItemPlacement(current, ids, placementKey(section, aisle));
  const written = await writeVisibilityConfig(supabase, vis);
  if (written.error) throw new Error(written.error.message);
}

function photoPayload(formData: FormData, photoUrl?: string) {
  if (String(formData.get("clear_image") || "") === "true") return { image_url: null };
  if (photoUrl) return { image_url: photoUrl };
  return {};
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
  const aisle_slug = String(formData.get("aisle_slug") || "").trim();

  if (!id || !name || Number.isNaN(price) || price < 0) {
    return { error: "Name and a valid price are required." };
  }
  const placementProblem = await placementError(category_id, aisle_slug);
  if (placementProblem) return { error: placementProblem };

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
    ...photoPayload(formData, photo.url),
  };
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
    await persistItemPlacement(supabase, [id], category_id, aisle_slug);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not hide this item." };
  }
  await refreshStorefront();
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
  const is_bestseller = formData.get("is_bestseller") === "on" || formData.get("is_bestseller") === "true";
  const is_new_arrival = formData.get("is_new_arrival") === "on" || formData.get("is_new_arrival") === "true";
  const is_deal = formData.get("is_deal") === "on" || formData.get("is_deal") === "true";
  const deal_label = String(formData.get("deal_label") || "");
  const catalogId = String(formData.get("catalog_id") || id).trim() || id;
  const relatedIds = String(formData.get("variant_ids") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const is_available = !(
    formData.get("is_out_of_stock") === "on" || formData.get("is_out_of_stock") === "true"
  );
  const description = String(formData.get("description") || "").trim() || null;
  const category_id = String(formData.get("category_id") || "").trim();
  const aisle_slug = String(formData.get("aisle_slug") || "").trim();
  const image_url = String(formData.get("image_url") || "").trim() || null;

  if (!id || !name || Number.isNaN(price) || price < 0) {
    return { error: "A valid price is required." };
  }
  const placementProblem = await placementError(category_id, aisle_slug);
  if (placementProblem) return { error: placementProblem };

  const supabase = createSupabaseAdmin();
  const photo = await storeProductPhoto(formData);
  if (photo.error) return { error: photo.error };
  const imageFields = photoPayload(formData, photo.url);

  const payload: Record<string, unknown> = {
    name,
    price,
    is_available,
    is_hidden,
    description,
    category_id,
    ...imageFields,
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
      image_url: "image_url" in imageFields ? imageFields.image_url : image_url,
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

  const siblingIds = [...new Set([catalogId, ...relatedIds].filter((itemId) => itemId !== id))];
  if (columnExists && siblingIds.length) {
    await Promise.all(
      siblingIds.map((itemId) =>
        supabase.from("menu_items").update({ is_hidden }).eq("id", itemId)
      )
    );
  }

  try {
    await syncItemHiddenFlag(
      supabase,
      id,
      is_hidden,
      columnExists,
      is_bestseller,
      catalogId,
      relatedIds,
      { is_new_arrival, is_deal, deal_label }
    );
    await persistItemPlacement(
      supabase,
      [...new Set([id, catalogId, ...relatedIds].filter(Boolean))],
      category_id,
      aisle_slug
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not hide this item." };
  }

  await refreshStorefront();
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
  const aisle_slug = String(formData.get("aisle_slug") || "").trim();
  const is_hidden = formData.get("is_hidden") === "on" || formData.get("is_hidden") === "true";
  const is_bestseller = formData.get("is_bestseller") === "on" || formData.get("is_bestseller") === "true";
  const is_new_arrival = formData.get("is_new_arrival") === "on" || formData.get("is_new_arrival") === "true";
  const is_deal = formData.get("is_deal") === "on" || formData.get("is_deal") === "true";
  const deal_label = String(formData.get("deal_label") || "");
  const is_available = !(
    formData.get("is_out_of_stock") === "on" || formData.get("is_out_of_stock") === "true"
  );
  const description = String(formData.get("description") || "").trim() || null;

  if (!name || Number.isNaN(price) || price < 0) {
    return { error: "Name and a valid price are required." };
  }
  const placementProblem = await placementError(category_id, aisle_slug);
  if (placementProblem) return { error: placementProblem };

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
    is_available,
    is_hidden,
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
    await syncItemHiddenFlag(supabase, id, is_hidden, columnExists, is_bestseller, id, [], {
      is_new_arrival,
      is_deal,
      deal_label,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save this item." };
  }
  try {
    await persistItemPlacement(supabase, [id], category_id, aisle_slug);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not move this item." };
  }
  await refreshStorefront();
  return { error: "", id };
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
  const current = await loadStoreVisibilityUncached();
  if (kind === "section" && !isKnownSection(current, slug)) {
    return { error: "Section is invalid." };
  }
  if (kind === "aisle" && !aisleSlugTaken(current, slug)) {
    return { error: "Category is invalid." };
  }

  const next = applyVisibilityToggle(current, kind, slug, hidden);

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("store_visibility").upsert(
    { kind, slug, hidden },
    { onConflict: "kind,slug" }
  );

  if (error) {
    if (/store_visibility|schema cache|does not exist|relation/i.test(error.message)) {
      const written = await writeVisibilityConfig(supabase, next);
      if (!written.error) {
        await refreshStorefront();
        return { error: "" };
      }
      try {
        await writeStoreVisibilityFallback(next);
        await refreshStorefront();
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

  const written = await writeVisibilityConfig(supabase, next);
  if (written.error) return { error: written.error.message };

  await refreshStorefront();
  return { error: "" };
}

export async function saveBannerPages(formData: FormData) {
  await requireAdmin();
  if (!hasSupabaseSecret()) return { error: "SUPABASE_SECRET_KEY is missing." };

  const id = String(formData.get("id") || "").trim();
  const current = await loadStoreVisibilityUncached();
  if (!bannerOptions(current).some((banner) => banner.id === id)) {
    return { error: "Banner was not found." };
  }

  const allowedPages = new Set(bannerPageOptions(current).map((page) => page.path));
  const pages = [...new Set(formData.getAll("pages").map((page) => String(page).trim()))];
  if (pages.some((page) => !allowedPages.has(page))) {
    return { error: "Choose pages from the list." };
  }

  const next = {
    ...current,
    bannerPages: { ...current.bannerPages, [id]: pages },
  };
  const written = await writeVisibilityConfig(createSupabaseAdmin(), next);
  if (written.error) return { error: written.error.message };
  await refreshStorefront();
  return { error: "" };
}

export async function saveShopExteriorText(formData: FormData) {
  await requireAdmin();
  if (!hasSupabaseSecret()) return { error: "SUPABASE_SECRET_KEY is missing." };

  const heading = String(formData.get("heading") || "").trim().slice(0, 120);
  const eyebrow = String(formData.get("eyebrow") || "").trim().slice(0, 80);
  const description = String(formData.get("description") || "").trim().slice(0, 240);
  const buttonLabel = String(formData.get("buttonLabel") || "").trim().slice(0, 50);
  if (!heading) return { error: "Enter a banner heading." };

  const current = await loadStoreVisibilityUncached();
  const next: StoreVisibility = {
    ...current,
    shopExteriorText: { eyebrow, heading, description, buttonLabel },
  };
  const written = await writeVisibilityConfig(createSupabaseAdmin(), next);
  if (written.error) return { error: written.error.message };
  await refreshStorefront();
  return { error: "" };
}

export async function addCategory(formData: FormData) {
  await requireAdmin();
  if (!hasSupabaseSecret()) {
    return { error: "SUPABASE_SECRET_KEY is missing." };
  }

  const kind = String(formData.get("kind") || "") as CategoryKind;
  const name = String(formData.get("name") || "").trim().slice(0, 40);
  const parent = String(formData.get("parent") || "").trim();
  if (kind !== "section" && kind !== "aisle") {
    return { error: "Category type is invalid." };
  }
  if (!name) return { error: "Enter a category name." };

  const vis = await loadStoreVisibilityUncached();
  if (kind === "aisle" && !isKnownSection(vis, parent)) {
    return { error: "Choose which category this sits inside." };
  }

  const taken = new Set<string>();
  if (kind === "section") {
    for (const section of listSections(vis)) taken.add(section.slug);
    taken.add("account");
    taken.add("admin");
    taken.add("api");
    taken.add("categories");
  } else {
    for (const section of listSections(vis)) {
      for (const aisle of listAisles(vis, section.slug)) taken.add(aisle.slug);
    }
  }
  const slug = uniqueCategorySlug(name, taken);
  if (!slug || (kind === "section" && isReservedSectionSlug(slug))) {
    return { error: "That name cannot be used as a category. Try another name." };
  }

  const photo = await storeProductPhoto(formData);
  if (photo.error) return { error: photo.error };

  const recordParent = kind === "section" ? "" : parent;
  const key = categoryKey(kind, slug, recordParent);
  const next = {
    ...vis,
    customCategories: [
      ...vis.customCategories,
      { kind, slug, name, parent: recordParent, image: photo.url },
    ],
    categoryNames: { ...vis.categoryNames, [key]: name },
    categoryImages: photo.url ? { ...vis.categoryImages, [key]: photo.url } : vis.categoryImages,
  };

  const supabase = createSupabaseAdmin();
  const written = await writeVisibilityConfig(supabase, next);
  if (written.error) return { error: written.error.message };
  await refreshStorefront();
  return { error: "" };
}

export async function renameCategory(formData: FormData) {
  await requireAdmin();
  if (!hasSupabaseSecret()) {
    return { error: "SUPABASE_SECRET_KEY is missing." };
  }

  const kind = String(formData.get("kind") || "") as CategoryKind;
  const slug = String(formData.get("slug") || "").trim();
  const parent = String(formData.get("parent") || "").trim();
  const name = String(formData.get("name") || "").trim().slice(0, 40);
  if (kind !== "section" && kind !== "aisle") {
    return { error: "Category type is invalid." };
  }
  if (!name) return { error: "Enter a category name." };

  const vis = await loadStoreVisibilityUncached();
  const recordParent = kind === "section" ? "" : parent;
  const exists =
    kind === "section" ? isKnownSection(vis, slug) : isKnownAisle(vis, recordParent, slug);
  if (!exists) return { error: "Category was not found." };

  const key = categoryKey(kind, slug, recordParent);
  const next = {
    ...vis,
    categoryNames: { ...vis.categoryNames, [key]: name },
    customCategories: vis.customCategories.map((category) =>
      category.kind === kind && category.slug === slug && category.parent === recordParent
        ? { ...category, name }
        : category
    ),
  };

  const supabase = createSupabaseAdmin();
  const written = await writeVisibilityConfig(supabase, next);
  if (written.error) return { error: written.error.message };
  await refreshStorefront();
  return { error: "" };
}

export async function setCategoryPhoto(formData: FormData) {
  await requireAdmin();
  if (!hasSupabaseSecret()) {
    return { error: "SUPABASE_SECRET_KEY is missing." };
  }

  const kind = String(formData.get("kind") || "") as CategoryKind;
  const slug = String(formData.get("slug") || "").trim();
  const parent = String(formData.get("parent") || "").trim();
  if (kind !== "section" && kind !== "aisle") {
    return { error: "Category type is invalid." };
  }

  const vis = await loadStoreVisibilityUncached();
  const recordParent = kind === "section" ? "" : parent;
  const exists =
    kind === "section" ? isKnownSection(vis, slug) : isKnownAisle(vis, recordParent, slug);
  if (!exists) return { error: "Category was not found." };

  const photo = await storeProductPhoto(formData);
  if (photo.error) return { error: photo.error };
  if (!photo.url) return { error: "Choose a photo." };

  const key = categoryKey(kind, slug, recordParent);
  const next = {
    ...vis,
    categoryImages: { ...vis.categoryImages, [key]: photo.url },
    customCategories: vis.customCategories.map((category) =>
      category.kind === kind && category.slug === slug && category.parent === recordParent
        ? { ...category, image: photo.url }
        : category
    ),
  };

  const supabase = createSupabaseAdmin();
  const written = await writeVisibilityConfig(supabase, next);
  if (written.error) return { error: written.error.message };
  await refreshStorefront();
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
