"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Guard from "../../components/Guard";
import Shell from "../../components/Shell";
import { api } from "../../lib/api";

export default function DeliveryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/orders/available")
      .then(setOrders)
      .catch((err) => setError(err.message));
    api("/orders/delivery/history")
      .then(setHistory)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <Guard role="delivery">
      <Shell title="vista de domiciliario">
        {error ? <p className="err">{error}</p> : null}
        <div className="card">
          <h3>ordenes disponibles</h3>
          {orders.map((o) => (
            <div className="item" key={o.id}>
              <span>
                {o.store_name} - {o.status}
              </span>
              <Link href={"/delivery/" + o.id}>ver detalle</Link>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>historial de ordenes aceptadas</h3>
          {history.map((o) => (
            <div className="item" key={o.id}>
              <span>
                {o.store_name} - {o.status}
              </span>
              <Link href={"/delivery/" + o.id}>abrir</Link>
            </div>
          ))}
        </div>
      </Shell>
    </Guard>
  );
}
