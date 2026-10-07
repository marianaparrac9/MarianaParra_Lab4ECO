"use client";

import { useEffect, useState } from "react";
import Guard from "../../components/Guard";
import Shell from "../../components/Shell";
import { api } from "../../lib/api";

export default function StoreAdminPage() {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const s = await api("/stores/mine");
      setStore(s);
      if (s) {
        const p = await api("/stores/" + s.id + "/products");
        setProducts(p);
      }
      const o = await api("/orders/store");
      setOrders(o);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle() {
    setError("");
    try {
      const s = await api("/stores/mine/toggle", { method: "PATCH" });
      setStore(s);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/products", {
        method: "POST",
        body: JSON.stringify({ name, price: Number(price) }),
      });
      setName("");
      setPrice("");
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function rename(id: string, value: string) {
    setError("");
    try {
      await api("/products/" + id, {
        method: "PATCH",
        body: JSON.stringify({ name: value }),
      });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <Guard role="store">
      <Shell title="administrador de tienda">
        {error ? <p className="err">{error}</p> : null}
        <div className="card">
          <h3>{store?.name}</h3>
          <p>estado: {store?.is_open ? "abierta" : "cerrada"}</p>
          <button onClick={toggle}>
            {store?.is_open ? "cerrar tienda" : "abrir tienda"}
          </button>
        </div>

        <div className="card">
          <h3>crear producto</h3>
          <form onSubmit={addProduct} className="row">
            <input placeholder="nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <input
              placeholder="precio"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <button type="submit">guardar</button>
          </form>
          {products.map((p) => (
            <div className="item" key={p.id}>
              <span>${p.price}</span>
              <input
                defaultValue={p.name}
                onBlur={(e) => {
                  if (e.target.value !== p.name) rename(p.id, e.target.value);
                }}
              />
            </div>
          ))}
        </div>

        <div className="card">
          <h3>ordenes de la tienda</h3>
          {orders.map((o) => (
            <div className="item" key={o.id}>
              <span>
                {o.items.map((i: any) => i.name + " x" + i.quantity).join(", ")}
              </span>
              <span className="badge">{o.status}</span>
            </div>
          ))}
        </div>
      </Shell>
    </Guard>
  );
}
