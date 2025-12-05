"use client";
import Dexie from "dexie";

export const db = new Dexie("CartDB");

db.version(1).stores({
  cart: "++id, productId, quantity",
});
