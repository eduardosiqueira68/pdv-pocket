import React, { createContext, useContext, useReducer, useCallback } from "react";
import { CartItem, calcLineTotal, calcCartTotal } from "@/lib/db/database";

interface CartState {
  items: CartItem[];
  discountTotalCents: number;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "INCREMENT"; payload: string } // barcode
  | { type: "DECREMENT"; payload: string }
  | { type: "REMOVE"; payload: string }
  | { type: "UPDATE_QTY"; payload: { barcode: string; quantity: number } }
  | { type: "SET_DISCOUNT_TOTAL"; payload: number }
  | { type: "CLEAR" };

const initialState: CartState = {
  items: [],
  discountTotalCents: 0,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.barcode === action.payload.barcode);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.barcode === action.payload.barcode
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] };
    }
    case "INCREMENT":
      return {
        ...state,
        items: state.items.map((i) =>
          i.barcode === action.payload ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };
    case "DECREMENT":
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.barcode === action.payload ? { ...i, quantity: i.quantity - 1 } : i
          )
          .filter((i) => i.quantity > 0),
      };
    case "REMOVE":
      return {
        ...state,
        items: state.items.filter((i) => i.barcode !== action.payload),
      };
    case "UPDATE_QTY":
      return {
        ...state,
        items: state.items.map((i) =>
          i.barcode === action.payload.barcode
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };
    case "SET_DISCOUNT_TOTAL":
      return { ...state, discountTotalCents: action.payload };
    case "CLEAR":
      return initialState;
    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addItem: (item: CartItem) => void;
  increment: (barcode: string) => void;
  decrement: (barcode: string) => void;
  removeItem: (barcode: string) => void;
  updateQty: (barcode: string, quantity: number) => void;
  setDiscountTotal: (cents: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  }, []);

  const increment = useCallback((barcode: string) => {
    dispatch({ type: "INCREMENT", payload: barcode });
  }, []);

  const decrement = useCallback((barcode: string) => {
    dispatch({ type: "DECREMENT", payload: barcode });
  }, []);

  const removeItem = useCallback((barcode: string) => {
    dispatch({ type: "REMOVE", payload: barcode });
  }, []);

  const updateQty = useCallback((barcode: string, quantity: number) => {
    dispatch({ type: "UPDATE_QTY", payload: { barcode, quantity } });
  }, []);

  const setDiscountTotal = useCallback((cents: number) => {
    dispatch({ type: "SET_DISCOUNT_TOTAL", payload: cents });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const getSubtotal = useCallback(() => {
    return calcCartTotal(state.items);
  }, [state.items]);

  const getTotal = useCallback(() => {
    return Math.max(0, calcCartTotal(state.items) - state.discountTotalCents);
  }, [state.items, state.discountTotalCents]);

  const getItemCount = useCallback(() => {
    return state.items.reduce((sum, i) => sum + i.quantity, 0);
  }, [state.items]);

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        increment,
        decrement,
        removeItem,
        updateQty,
        setDiscountTotal,
        clearCart,
        getTotal,
        getSubtotal,
        getItemCount,
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
