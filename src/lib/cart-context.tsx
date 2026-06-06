"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getTeamName, getUnitPrice } from "@/lib/catalog";
import { readStorage, writeStorage } from "@/lib/storage";
import { CartItem, Flocking, Product, ProductType, Size } from "@/lib/types";

const CART_KEY = "jersey-store.cart";

type AddCartItemInput = {
  product: Product;
  size: Size;
  type: ProductType;
  quantity: number;
  flocking: Flocking;
};

type CartContextValue = {
  items: CartItem[];
  total: number;
  count: number;
  addItem: (input: AddCartItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function flockingKey(flocking: Flocking) {
  return [
    flocking.mode,
    flocking.name ?? "",
    flocking.number ?? "",
    flocking.player ?? "",
    flocking.note ?? "",
  ].join("-");
}

function createCartItemId(input: AddCartItemInput) {
  return [input.product.id, input.size, input.type, flockingKey(input.flocking)].join("|");
}

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>(() => readStorage<CartItem[]>(CART_KEY, []));

  useEffect(() => {
    writeStorage(CART_KEY, items);
  }, [items]);

  const addItem = useCallback((input: AddCartItemInput) => {
    const hasFlocking = input.flocking.mode !== "none";
    const id = createCartItemId(input);
    const unitPrice = getUnitPrice(input.product, input.type, hasFlocking);

    setItems((current) => {
      const existing = current.find((item) => item.id === id);
      if (existing) {
        return current.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + input.quantity } : item,
        );
      }

      return [
        ...current,
        {
          id,
          productId: input.product.id,
          productName: input.product.name,
          teamName: getTeamName(input.product.teamId),
          size: input.size,
          type: input.type,
          quantity: input.quantity,
          unitPrice,
          flocking: input.flocking,
          visual: input.product.visual,
          image: input.product.images[0],
        },
      ];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, Math.min(99, quantity)) } : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      total,
      count,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    };
  }, [addItem, clearCart, items, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
