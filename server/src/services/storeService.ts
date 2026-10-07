import { pool } from "../db";

export async function getOpenStores() {
  const result = await pool.query(
    "SELECT id, name, is_open, user_owner_id FROM stores WHERE is_open = true"
  );
  return result.rows;
}

export async function getStoreByOwner(userId: string) {
  const result = await pool.query(
    "SELECT id, name, is_open, user_owner_id FROM stores WHERE user_owner_id = $1",
    [userId]
  );
  return result.rows[0];
}

export async function toggleStore(userId: string) {
  const store = await getStoreByOwner(userId);
  if (!store) {
    throw new Error("tienda no encontrada");
  }

  const result = await pool.query(
    "UPDATE stores SET is_open = NOT is_open WHERE id = $1 RETURNING id, name, is_open, user_owner_id",
    [store.id]
  );
  return result.rows[0];
}

export async function getStoreProducts(storeId: string) {
  const result = await pool.query(
    "SELECT id, name, price, store_id FROM products WHERE store_id = $1",
    [storeId]
  );
  return result.rows;
}

export async function getStoreById(storeId: string) {
  const result = await pool.query(
    "SELECT id, name, is_open, user_owner_id FROM stores WHERE id = $1",
    [storeId]
  );
  return result.rows[0];
}
