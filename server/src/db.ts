import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function initDB() {
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
  } catch {}

  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS postgis");
  } catch {}

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      is_open BOOLEAN NOT NULL DEFAULT false,
      user_owner_id UUID UNIQUE REFERENCES users(id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      store_id UUID NOT NULL REFERENCES stores(id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID NOT NULL REFERENCES users(id),
      delivery_id UUID NULL REFERENCES users(id),
      store_id UUID NOT NULL REFERENCES stores(id),
      status TEXT NOT NULL,
      destination GEOGRAPHY(POINT, 4326),
      delivery_position GEOGRAPHY(POINT, 4326),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id),
      product_id UUID NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL
    )
  `);
}
