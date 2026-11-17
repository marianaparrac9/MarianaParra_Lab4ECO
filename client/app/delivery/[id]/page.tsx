"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { RealtimeChannel } from "@supabase/supabase-js";
import Guard from "../../../components/Guard";
import Shell from "../../../components/Shell";
import { api } from "../../../lib/api";
import { supabase } from "../../../lib/supabase";
import { statusClass, statusLabel } from "../../../lib/status";
import { useAuth } from "../../../context/AuthContext";
import type { Point } from "../../../components/Map";

const Map = dynamic(() => import("../../../components/Map"), { ssr: false });

const step = 0.00005;

export default function DeliveryDetailPage() {
  const params = useParams();
  const orderId = String(params.id);
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [rider, setRider] = useState<Point | null>(null);
  const [error, setError] = useState("");

  const riderRef = useRef<Point | null>(null);
  const orderChannel = useRef<RealtimeChannel | null>(null);
  const storeChannel = useRef<RealtimeChannel | null>(null);
  const lastSend = useRef(0);
  const timer = useRef<any>(null);
  const pending = useRef<Point | null>(null);

  function showOrder(data: any) {
    setOrder(data);
    if (data.pos_lat !== null) {
      const p = { lat: data.pos_lat, lng: data.pos_lng };
      riderRef.current = p;
      setRider(p);
    }
  }

  async function load() {
    try {
      const data = await api("/orders/" + orderId);
      showOrder(data);
      if (data.delivery_id && user && data.delivery_id !== user.id) {
        setError("la orden ya fue aceptada por otro domiciliario");
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (user) load();
  }, [orderId, user]);

  useEffect(() => {
    if (!order?.store_id) return;
    orderChannel.current = supabase.channel("order-" + orderId).subscribe();
    storeChannel.current = supabase.channel("store-" + order.store_id).subscribe();
    return () => {
      if (orderChannel.current) supabase.removeChannel(orderChannel.current);
      if (storeChannel.current) supabase.removeChannel(storeChannel.current);
      orderChannel.current = null;
      storeChannel.current = null;
    };
  }, [orderId, order?.store_id]);

  function broadcast(data: any) {
    orderChannel.current?.send({
      type: "broadcast",
      event: "position",
      payload: { lat: data.pos_lat, lng: data.pos_lng, status: data.status },
    });
    storeChannel.current?.send({
      type: "broadcast",
      event: "order-update",
      payload: { id: data.id, status: data.status },
    });
    if (data.status === "delivered") {
      orderChannel.current?.send({ type: "broadcast", event: "delivered", payload: { id: data.id } });
    }
  }

  async function savePosition(p: Point) {
    try {
      const data = await api("/orders/" + orderId + "/position", {
        method: "PATCH",
        body: JSON.stringify(p),
      });
      setOrder(data);
      broadcast(data);
      if (data.status === "delivered") {
        pending.current = null;
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  function flush() {
    timer.current = null;
    lastSend.current = Date.now();
    const p = pending.current;
    pending.current = null;
    if (p) savePosition(p);
  }

  function throttleSave(p: Point) {
    pending.current = p;
    const wait = 1000 - (Date.now() - lastSend.current);
    if (wait <= 0) {
      flush();
    } else if (!timer.current) {
      timer.current = setTimeout(flush, wait);
    }
  }

  const mine = order && user && order.delivery_id === user.id;
  const moving = mine && order.status === "in_progress";

  useEffect(() => {
    if (!moving) return;

    function onKey(e: KeyboardEvent) {
      const now = riderRef.current;
      if (!now) return;
      let next: Point | null = null;
      if (e.key === "ArrowUp") next = { lat: now.lat + step, lng: now.lng };
      if (e.key === "ArrowDown") next = { lat: now.lat - step, lng: now.lng };
      if (e.key === "ArrowLeft") next = { lat: now.lat, lng: now.lng - step };
      if (e.key === "ArrowRight") next = { lat: now.lat, lng: now.lng + step };
      if (!next) return;
      e.preventDefault();
      riderRef.current = next;
      setRider(next);
      throttleSave(next);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moving]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function accept() {
    setError("");
    try {
      const data = await api("/orders/" + orderId + "/accept", { method: "POST" });
      showOrder(data);
      broadcast(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function reject() {
    setError("");
    try {
      const data = await api("/orders/" + orderId + "/reject", { method: "POST" });
      riderRef.current = null;
      setRider(null);
      setOrder(data);
      storeChannel.current?.send({
        type: "broadcast",
        event: "order-update",
        payload: { id: data.id, status: data.status },
      });
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <Guard role="delivery">
      <Shell title="detalle de orden">
        <Link href="/delivery">volver</Link>
        {error ? <p className="err">{error}</p> : null}
        {order ? (
          <div className="card">
            <p>tienda: {order.store_name}</p>
            <p>
              estado: <span className={statusClass(order.status)}>{statusLabel(order.status)}</span>
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
              {moving ? (
                <button className="ghost" onClick={reject}>
                  rechazar / soltar
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {order && mine && order.status !== "waiting_for_deliver" ? (
          <div className="card">
            <h3>mapa de la entrega</h3>
            {moving ? (
              <p className="hint">
                muevete con las flechas del teclado. cuando estes a menos de 10 metros del punto
                de entrega el pedido se entrega solo
              </p>
            ) : null}
            {order.status === "delivered" ? <p className="ok">pedido entregado</p> : null}
            <Map destination={{ lat: order.dest_lat, lng: order.dest_lng }} rider={rider} />
          </div>
        ) : null}
      </Shell>
    </Guard>
  );
}
