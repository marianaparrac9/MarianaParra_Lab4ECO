"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Guard from "../../../components/Guard";
import Shell from "../../../components/Shell";
import { api } from "../../../lib/api";

export default function StoreProductsPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = String(params.id);
  const [products, setProducts] = useState<any[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [storeOpen, setStoreOpen] = useState(true);

  useEffect(() => {
    api("/stores/" + storeId)
      .then((store) => setStoreOpen(!!store.is_open))
      .catch(() => setStoreOpen(false));

    api("/stores/" + storeId + "/products")
      .then(setProducts)
      .catch((err) => setError(err.message));
  }, [storeId]);

  function changeQty(id: string, value: number) {
    setQty({ ...qty, [id]: value });
  }

  async function sendOrder() {
    setError("");
    const items = products
      .map((p) => ({ product_id: p.id, quantity: Number(qty[p.id] || 0) }))
      .filter((i) => i.quantity > 0);
    try {
      await api("/orders", {
        method: "POST",
        body: JSON.stringify({ store_id: storeId, items }),
      });
      router.push("/client/orders");
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <Guard role="consumer">
      <Shell title="productos de la tienda">
        <Link href="/client">volver a tiendas</Link>
        <div className="card">
          {!storeOpen ? (
            <p className="err">la tienda esta cerrada, la compra esta deshabilitada</p>
          ) : null}
          {products.map((p) => (
            <div className="item" key={p.id}>
              <span>
                {p.name} - ${p.price}
              </span>
              <input
                type="number"
                min={0}
                value={qty[p.id] || 0}
                onChange={(e) => changeQty(p.id, Number(e.target.value))}
                disabled={!storeOpen}
                style={{ width: 80 }}
              />
            </div>
          ))}
          <button onClick={sendOrder} disabled={!storeOpen} style={{ marginTop: 12 }}>
            crear orden
          </button>
          {error ? <p className="err">{error}</p> : null}
        </div>
      </Shell>
    </Guard>
  );
}
