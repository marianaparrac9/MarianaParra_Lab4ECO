"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Guard from "../../../components/Guard";
import Shell from "../../../components/Shell";
import { api } from "../../../lib/api";
import { notify } from "../../../lib/supabase";
import type { Point } from "../../../components/Map";

const Map = dynamic(() => import("../../../components/Map"), { ssr: false });

export default function StoreProductsPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = String(params.id);
  const [products, setProducts] = useState<any[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [storeOpen, setStoreOpen] = useState(true);
  const [spot, setSpot] = useState<Point | null>(null);

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
    if (!spot) {
      setError("toca el mapa para elegir donde te entregan");
      return;
    }
    const items = products
      .map((p) => ({ product_id: p.id, quantity: Number(qty[p.id] || 0) }))
      .filter((i) => i.quantity > 0);
    try {
      const order = await api("/orders", {
        method: "POST",
        body: JSON.stringify({ store_id: storeId, items, lat: spot.lat, lng: spot.lng }),
      });
      notify("store-" + storeId, "order-update", { id: order.id, status: order.status });
      router.push("/client/orders/" + order.id);
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
        </div>

        <div className="card">
          <h3>donde te entregamos</h3>
          <p className="hint">toca el mapa para marcar tu ubicacion de entrega</p>
          <Map destination={spot} onPick={setSpot} />
          {spot ? (
            <p className="hint">
              punto elegido: {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}
            </p>
          ) : null}
          <button onClick={sendOrder} disabled={!storeOpen} style={{ marginTop: 12 }}>
            crear orden
          </button>
          {error ? <p className="err">{error}</p> : null}
        </div>
      </Shell>
    </Guard>
  );
}
