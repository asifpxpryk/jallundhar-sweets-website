export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_hidden?: boolean;
  is_bestseller?: boolean;
  is_new_arrival?: boolean;
  is_deal?: boolean;
  /** Short shop-written line, shown when is_deal is set. The price stays the saved price. */
  deal_label?: string;
  sort_order: number;
  /** Set on search results so general-store items open the right aisle. */
  search_aisle?: string;
  company?: string;
  beverage_type?: string;
  preview_only?: boolean;
  image_is_illustrative?: boolean;
  variants?: { id: string; label: string; price: number; is_available?: boolean }[];
};

export type MenuCategory = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  items: MenuItem[];
};

export type CartLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type PaymentMethod = "cod" | "advance";

export type SavedOrder = {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  address: string;
  location: string;
  payment_method: PaymentMethod;
  notes: string;
  total: number;
  items: { id?: string; name: string; quantity: number; unit_price: number }[];
};

export type AdminOrder = SavedOrder & {
  order_number: number | null;
};
