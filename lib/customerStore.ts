import type { SavedOrder } from "@/lib/types";

export type CustomerProfile = {
  name: string;
  phone: string;
  address: string;
  location: string;
};

const PROFILE_KEY = "jallundhar_profile";
const ORDERS_KEY = "jallundhar_orders";

export function loadProfile(): CustomerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomerProfile;
    if (!parsed.phone?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfile(profile: CustomerProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

export function loadLocalOrders(phone: string): SavedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const all = raw ? (JSON.parse(raw) as SavedOrder[]) : [];
    const needle = phone.replace(/\s+/g, "");
    return all.filter((order) => order.phone.replace(/\s+/g, "") === needle);
  } catch {
    return [];
  }
}

export function saveLocalOrder(order: SavedOrder) {
  const raw = localStorage.getItem(ORDERS_KEY);
  const all = raw ? (JSON.parse(raw) as SavedOrder[]) : [];
  all.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(all.slice(0, 50)));
}
