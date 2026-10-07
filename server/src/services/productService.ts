import { pool } from "../db";
import { getStoreByOwner } from "./storeService";

export async function createProduct(userId: string, name: string, price: number) {
  const store = await getStoreByOwner(userId);
  if (!store) {
    throw new Error("tienda no encontrada");
  }
  if (!name || !price || price <= 0) {
    throw new Error("datos de producto invalidos");
  }

  const result = await pool.query(
    "INSERT INTO products (name, price, store_id) VALUES ($1, $2, $3) RETURNING id, name, price, store_id",
    [name, price, store.id]
  );
  return result.rows[0];
}

export async function updateProductName(userId: string, productId: string, name: string) {
  const store = await getStoreByOwner(userId);
  if (!store) {
    throw new Error("tienda no encontrada");
  }
  if (!name) {
    throw new Error("el nombre es obligatorio");
  }

  const result = await pool.query(
    "UPDATE products SET name = $1 WHERE id = $2 AND store_id = $3 RETURNING id, name, price, store_id",
    [name, productId, store.id]
  );
  if (!result.rows[0]) {
    throw new Error("producto no encontrado");
  }
  return result.rows[0];
}
