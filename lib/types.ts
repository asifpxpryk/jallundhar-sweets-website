export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  variants?: { id: string; label: string; price: number }[];
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
