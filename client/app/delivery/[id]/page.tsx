"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Guard from "../../../components/Guard";
import Shell from "../../../components/Shell";
import { api } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

export default function DeliveryDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api("/orders/" + params.id);
      setOrder(data);
      if (data.delivery_id && user && data.delivery_id !== user.id) {
        setError("la orden ya fue aceptada por otro domiciliario");
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (user) load();
  }, [params.id, user]);

  async function accept() {
    setError("");
    try {
      const data = await api("/orders/" + params.id + "/accept", { method: "POST" });
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function reject() {
    setError("");
    try {
      const data = await api("/orders/" + params.id + "/reject", { method: "POST" });
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deliver() {
    setError("");
    try {
      const data = await api("/orders/" + params.id + "/deliver", { method: "POST" });
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  const mine = order && user && order.delivery_id === user.id;

  return (
    <Guard role="delivery">
      <Shell title="detalle de orden">
        <Link href="/delivery">volver</Link>
        {error ? <p className="err">{error}</p> : null}
        {order ? (
          <div className="card">
            <p>tienda: {order.store_name}</p>
            <p>
              estado: <span className="badge">{order.status}</span>
            </p>
            {order.items.map((i: any) => (
              <p key={i.id}>
                {i.name} x {i.quantity}
              </p>
            ))}
            <div className="row" style={{ marginTop: 12 }}>
              {order.status === "waiting_for_deliver" && !order.delivery_id ? (
                <button onClick={accept}>aceptar</button>
              ) : null}
              {mine && order.status === "in_progress" ? (
                <button onClick={reject}>rechazar / soltar</button>
              ) : null}
              {mine && order.status === "in_progress" ? (
                <button onClick={deliver}>marcar entregada</button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Shell>
    </Guard>
  );
}
