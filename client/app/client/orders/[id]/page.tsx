"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Link from "next/link";
import Guard from "../../../../components/Guard";
import Shell from "../../../../components/Shell";
import { api } from "../../../../lib/api";
import { supabase } from "../../../../lib/supabase";
import { statusClass, statusLabel } from "../../../../lib/status";
import type { Point } from "../../../../components/Map";

const Map = dynamic(() => import("../../../../components/Map"), { ssr: false });

export default function TrackOrderPage() {
  const params = useParams();
  const orderId = String(params.id);
  const [order, setOrder] = useState<any>(null);
  const [rider, setRider] = useState<Point | null>(null);
  const [arrived, setArrived] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/orders/" + orderId)
      .then((data) => {
        setOrder(data);
        if (data.pos_lat !== null) setRider({ lat: data.pos_lat, lng: data.pos_lng });
      })
      .catch((err) => setError(err.message));

    const channel = supabase
      .channel("order-" + orderId)
      .on("broadcast", { event: "position" }, ({ payload }) => {
        setRider({ lat: payload.lat, lng: payload.lng });
        setOrder((prev: any) => (prev ? { ...prev, status: payload.status } : prev));
      })
      .on("broadcast", { event: "delivered" }, () => {
        setOrder((prev: any) => (prev ? { ...prev, status: "delivered" } : prev));
        setArrived(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return (
    <Guard role="consumer">
      <Shell title="seguimiento de tu pedido">
        <Link href="/client/orders">volver a mis ordenes</Link>
        {arrived ? (
          <div className="toast" onClick={() => setArrived(false)}>
            <strong>tu pedido llego</strong>
            <p>el repartidor ya esta en tu puerta, el pedido quedo entregado</p>
          </div>
        ) : null}
        {error ? <p className="err">{error}</p> : null}
        {order ? (
          <div className="card">
            <div className="item">
              <strong>{order.store_name}</strong>
              <span className={statusClass(order.status)}>{statusLabel(order.status)}</span>
            </div>
            {order.status === "waiting_for_deliver" ? (
              <p className="hint">esperando a que un repartidor acepte tu pedido</p>
            ) : null}
            {order.status === "in_progress" ? (
              <p className="hint">el repartidor va en camino, lo ves moverse en el mapa</p>
            ) : null}
            {order.status === "delivered" ? <p className="ok">pedido entregado</p> : null}
            <Map
              destination={order.dest_lat !== null ? { lat: order.dest_lat, lng: order.dest_lng } : null}
              rider={rider}
            />
          </div>
        ) : null}
      </Shell>
    </Guard>
  );
}
