"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine, MenuItem } from "@/lib/types";

const STORAGE_KEY = "jallundhar-cart-v1";

type CartEntry = "cart" | "checkout";

type CartContextValue = {
  lines: CartLine[];
  add: (item: MenuItem) => void;
  addMany: (incoming: CartLine[]) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  setLine: (item: MenuItem, quantity: number) => void;
  adjust: (id: string, delta: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  isOpen: boolean;
  entry: CartEntry;
  open: () => void;
  openCheckout: () => void;
  close: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredLines(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is CartLine =>
        Boolean(line) &&
        typeof line.id === "string" &&
        typeof line.name === "string" &&
        typeof line.price === "number" &&
        typeof line.quantity === "number" &&
        line.quantity > 0
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [entry, setEntry] = useState<CartEntry>("cart");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(readStoredLines());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Ignore quota / private-mode failures.
    }
  }, [lines, ready]);

  function add(item: MenuItem) {
    setLines((prev) => {
      const existing = prev.find((l) => l.id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.id === item.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  }

  function addMany(incoming: CartLine[]) {
    setLines((prev) => {
      const next = [...prev];
      for (const line of incoming) {
        if (!line.id || line.quantity <= 0) continue;
        const index = next.findIndex((existing) => existing.id === line.id);
        if (index >= 0) {
          next[index] = { ...next[index], quantity: next[index].quantity + line.quantity };
        } else {
          next.push({ id: line.id, name: line.name, price: line.price, quantity: line.quantity });
        }
      }
      return next;
    });
  }

  function remove(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  function setQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      remove(id);
      return;
    }
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, quantity } : l)));
  }

  function setLine(item: MenuItem, quantity: number) {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((line) => line.id !== item.id);
      const existing = prev.find((line) => line.id === item.id);
      if (!existing) {
        return [...prev, { id: item.id, name: item.name, price: item.price, quantity }];
      }
      return prev.map((line) =>
        line.id === item.id ? { ...line, name: item.name, price: item.price, quantity } : line
      );
    });
  }

  function adjust(id: string, delta: number) {
    setLines((prev) => {
      const current = prev.find((line) => line.id === id);
      if (!current) return prev;
      const next = current.quantity + delta;
      if (next <= 0) return prev.filter((line) => line.id !== id);
      return prev.map((line) => (line.id === id ? { ...line, quantity: next } : line));
    });
  }

  function clear() {
    setLines([]);
  }

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity * l.price, 0),
    [lines]
  );

  return (
    <CartContext.Provider
      value={{
        lines,
        add,
        addMany,
        remove,
        setQuantity,
        setLine,
        adjust,
        clear,
        count,
        subtotal,
        isOpen,
        entry,
        open: () => {
          setEntry("cart");
          setIsOpen(true);
        },
        openCheckout: () => {
          setEntry("checkout");
          setIsOpen(true);
        },
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
