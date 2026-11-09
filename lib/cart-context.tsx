"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { Product } from "./products";
import { parseCatalog } from "./storefront-catalog";
import { commerceEvent, trackCommerce } from "./analytics";
import {
  boundedQuantity,
  parseStoredCart,
  reconcileCart,
  type CartItem,
  type CartRefresh,
} from "./cart-state";
export type { CartItem } from "./cart-state";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  refreshCart: () => Promise<CartRefresh>;
  isHydrated: boolean;
  isRefreshing: boolean;
  totalItems: number;
  totalPrice: number;
}
const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsRef = useRef(items);
  const refreshRef = useRef<Promise<CartRefresh> | null>(null);
  const replaceItems = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);
  const changeItems = useCallback(
    (next: CartItem[]) => {
      const previous = itemsRef.current;
      replaceItems(next);
      const added = next.flatMap((item) => {
        const before =
          previous.find((entry) => entry.product.id === item.product.id)
            ?.quantity || 0;
        return item.quantity > before
          ? [{ product: item.product, quantity: item.quantity - before }]
          : [];
      });
      const removed = previous.flatMap((item) => {
        const after =
          next.find((entry) => entry.product.id === item.product.id)?.quantity ||
          0;
        return item.quantity > after
          ? [{ product: item.product, quantity: item.quantity - after }]
          : [];
      });
      // Only user changes emit events. Keep side effects outside React state updaters.
      if (added.length) trackCommerce("add_to_cart", commerceEvent(added));
      if (removed.length) trackCommerce("remove_from_cart", commerceEvent(removed));
    },
    [replaceItems],
  );

  useEffect(() => {
    try {
      replaceItems(parseStoredCart(localStorage.getItem("measurejoy-cart")));
    } catch {
      /* Private browsing may block storage. */
    }
    setIsHydrated(true);
  }, [replaceItems]);
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem("measurejoy-cart", JSON.stringify(items));
      } catch {
        /* The bag still works for this visit. */
      }
    }
  }, [items, isHydrated]);

  const addItem = useCallback(
    (product: Product, quantity = 1) => {
      if (!Number.isSafeInteger(quantity) || quantity < 1) return;
      const previous = itemsRef.current;
      const existing = previous.find((item) => item.product.id === product.id);
      const nextQuantity = boundedQuantity(
        product,
        (existing?.quantity || 0) + quantity,
      );
      if (nextQuantity === 0) return;
      changeItems(
        existing
          ? previous.map((item) =>
              item.product.id === product.id
                ? { product, quantity: nextQuantity }
                : item,
            )
          : [...previous, { product, quantity: nextQuantity }],
      );
    },
    [changeItems],
  );
  const removeItem = useCallback(
    (productId: string) =>
      changeItems(
        itemsRef.current.filter((item) => item.product.id !== productId),
      ),
    [changeItems],
  );
  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (!Number.isSafeInteger(quantity)) return;
      const previous = itemsRef.current;
      changeItems(
        quantity < 1
          ? previous.filter((item) => item.product.id !== productId)
          : previous.map((item) => {
              if (item.product.id !== productId) return item;
              const next = boundedQuantity(item.product, quantity);
              return next > 0 ? { ...item, quantity: next } : item;
            }),
      );
    },
    [changeItems],
  );
  const clearCart = useCallback(() => replaceItems([]), [replaceItems]);
  const refreshCart = useCallback(() => {
    if (refreshRef.current) return refreshRef.current;
    setIsRefreshing(true);
    const request = (async () => {
      const response = await fetch("/api/products", {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(
          "We couldn’t check the latest prices and availability. Please try again.",
        );
      const catalog = parseCatalog(await response.json());
      const refreshed = reconcileCart(itemsRef.current, catalog);
      replaceItems(refreshed.items);
      return refreshed;
    })().finally(() => {
      refreshRef.current = null;
      setIsRefreshing(false);
    });
    refreshRef.current = request;
    return request;
  }, [replaceItems]);
  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      refreshCart,
      isHydrated,
      isRefreshing,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: items.reduce(
        (sum, item) => sum + item.product.priceInCents * item.quantity,
        0,
      ),
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      refreshCart,
      isHydrated,
      isRefreshing,
    ],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
