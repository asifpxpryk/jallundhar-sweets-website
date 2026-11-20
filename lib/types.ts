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
  /** Price, stock and hide come from the shop POS (menu_items.pos_linked); admin can't edit them. */
  pos_linked?: boolean;
  pos_product_id?: string | null;
  /** Shop POS deal, read from menu_items.deal_price / deal_label / deal_ends_at (see lib/posDeal). */
  pos_deal_price?: number | null;
  pos_deal_label?: string | null;
  pos_deal_ends_at?: string | null;
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
  /** Price of one quantity step; for a weighed sweet that is 500 g. */
  price: number;
  /** Pieces, or 500 g steps when `weighed` is set. */
  quantity: number;
  /** Loose mithai sold by weight (see lib/sweetWeight). */
  weighed?: boolean;
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
  items: { id?: string; name: string; quantity: number; unit_price: number; weighed?: boolean }[];
};

export type AdminOrder = SavedOrder & {
  order_number: number | null;
};
