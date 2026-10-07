import { pool } from "../db";
import { getStoreById, getStoreByOwner } from "./storeService";

export async function createOrder(
  clientId: string,
  storeId: string,
  items: { product_id: string; quantity: number }[]
) {
  const store = await getStoreById(storeId);
  if (!store) {
    throw new Error("tienda no encontrada");
  }
  if (!store.is_open) {
    throw new Error("la tienda esta cerrada");
  }
  if (!items || !items.length) {
    throw new Error("la orden no tiene productos");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orderRes = await client.query(
      "INSERT INTO orders (client_id, delivery_id, store_id, status) VALUES ($1, NULL, $2, $3) RETURNING *",
      [clientId, storeId, "waiting_for_deliver"]
    );
    const order = orderRes.rows[0];

    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        throw new Error("cantidad invalida");
      }
      const product = await client.query(
        "SELECT id FROM products WHERE id = $1 AND store_id = $2",
        [item.product_id, storeId]
      );
      if (!product.rows[0]) {
        throw new Error("producto invalido");
      }
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)",
        [order.id, item.product_id, item.quantity]
      );
    }

    await client.query("COMMIT");
    return await getOrderById(order.id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getOrdersByClient(clientId: string) {
  const result = await pool.query(
    "SELECT * FROM orders WHERE client_id = $1 ORDER BY created_at DESC",
    [clientId]
  );
  return Promise.all(result.rows.map((row) => attachItems(row)));
}

export async function getOrdersByStore(userId: string) {
  const store = await getStoreByOwner(userId);
  if (!store) {
    throw new Error("tienda no encontrada");
  }
  const result = await pool.query(
    "SELECT * FROM orders WHERE store_id = $1 ORDER BY created_at DESC",
    [store.id]
  );
  return Promise.all(result.rows.map((row) => attachItems(row)));
}

export async function getAvailableOrders() {
  const result = await pool.query(
    "SELECT * FROM orders WHERE delivery_id IS NULL AND status = $1 ORDER BY created_at DESC",
    ["waiting_for_deliver"]
  );
  return Promise.all(result.rows.map((row) => attachItems(row)));
}

export async function getDeliveryHistory(deliveryId: string) {
  const result = await pool.query(
    "SELECT * FROM orders WHERE delivery_id = $1 ORDER BY created_at DESC",
    [deliveryId]
  );
  return Promise.all(result.rows.map((row) => attachItems(row)));
}

export async function getOrderById(orderId: string) {
  const result = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
  if (!result.rows[0]) {
    throw new Error("orden no encontrada");
  }
  return attachItems(result.rows[0]);
}

export async function acceptOrder(deliveryId: string, orderId: string) {
  const order = await getOrderById(orderId);
  if (order.delivery_id) {
    throw new Error("la orden ya fue aceptada por otro domiciliario");
  }
  if (order.status !== "waiting_for_deliver") {
    throw new Error("la orden no esta disponible");
  }

  const result = await pool.query(
    "UPDATE orders SET delivery_id = $1, status = $2 WHERE id = $3 AND delivery_id IS NULL RETURNING *",
    [deliveryId, "in_progress", orderId]
  );
  if (!result.rows[0]) {
    throw new Error("la orden ya fue aceptada por otro domiciliario");
  }
  return attachItems(result.rows[0]);
}

export async function rejectOrder(deliveryId: string, orderId: string) {
  const order = await getOrderById(orderId);
  if (order.delivery_id !== deliveryId) {
    throw new Error("no puedes soltar esta orden");
  }
  if (order.status !== "in_progress") {
    throw new Error("la orden no se puede soltar");
  }

  const result = await pool.query(
    "UPDATE orders SET delivery_id = NULL, status = $1 WHERE id = $2 RETURNING *",
    ["waiting_for_deliver", orderId]
  );
  return attachItems(result.rows[0]);
}

export async function deliverOrder(deliveryId: string, orderId: string) {
  const order = await getOrderById(orderId);
  if (order.delivery_id !== deliveryId) {
    throw new Error("no puedes entregar esta orden");
  }
  if (order.status !== "in_progress") {
    throw new Error("la orden no esta en progreso");
  }

  const result = await pool.query(
    "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
    ["delivered", orderId]
  );
  return attachItems(result.rows[0]);
}

async function attachItems(order: any) {
  const items = await pool.query(
    `SELECT order_items.id, order_items.quantity, products.name, products.price, order_items.product_id
     FROM order_items
     JOIN products ON products.id = order_items.product_id
     WHERE order_items.order_id = $1`,
    [order.id]
  );
  const store = await pool.query("SELECT name FROM stores WHERE id = $1", [order.store_id]);
  return {
    ...order,
    store_name: store.rows[0]?.name,
    items: items.rows,
  };
}
