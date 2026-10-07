"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Shell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();

  function salir() {
    logout();
    router.replace("/");
  }

  return (
    <div>
      <div className="top">
        <div>
          <h1>lab mari parra</h1>
          <p>{title}</p>
        </div>
        <div>
          {user ? <span>{user.name} ({user.role}) </span> : null}
          {user ? (
            <button className="ghost" onClick={salir}>
              salir
            </button>
          ) : null}
        </div>
      </div>
      <div className="wrap">{children}</div>
    </div>
  );
}
