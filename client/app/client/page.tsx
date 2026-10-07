"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Guard from "../../components/Guard";
import Shell from "../../components/Shell";
import { api } from "../../lib/api";

export default function ClientPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/stores")
      .then(setStores)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <Guard role="consumer">
      <Shell title="vista de cliente">
        <div className="nav">
          <Link href="/client">tiendas</Link>
          <Link href="/client/orders">mis ordenes</Link>
        </div>
        <div className="card">
          <h3>tiendas abiertas</h3>
          {error ? <p className="err">{error}</p> : null}
          {stores.length === 0 ? <p>no hay tiendas abiertas</p> : null}
          {stores.map((s) => (
            <div className="item" key={s.id}>
              <span>{s.name}</span>
              <Link href={"/client/" + s.id}>ver productos</Link>
            </div>
          ))}
        </div>
      </Shell>
    </Guard>
  );
}
