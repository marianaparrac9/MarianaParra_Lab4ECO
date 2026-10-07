"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Guard from "../../../components/Guard";
import Shell from "../../../components/Shell";
import { api } from "../../../lib/api";

export default function ClientOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/orders/mine")
      .then(setOrders)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <Guard role="consumer">
      <Shell title="mis ordenes">
        <Link href="/client">volver a tiendas</Link>
        {error ? <p className="err">{error}</p> : null}
        {orders.map((o) => (
          <div className="card" key={o.id}>
            <div className="item">
              <strong>{o.store_name}</strong>
              <span className="badge">{o.status}</span>
            </div>
            {o.items.map((i: any) => (
              <p key={i.id}>
                {i.name} x {i.quantity}
              </p>
            ))}
          </div>
        ))}
      </Shell>
    </Guard>
  );
}
