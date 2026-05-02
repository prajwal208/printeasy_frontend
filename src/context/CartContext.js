"use client";

import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(() => {
    if (typeof window === "undefined") return 0;
    const savedCount = localStorage.getItem("count");
    return savedCount ? Number(savedCount) : 0;
  });

  const updateCart = (newCount) => {
    setCartCount(newCount);
    localStorage.setItem("count", newCount);
  };

  return (
    <CartContext.Provider value={{ cartCount, updateCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
