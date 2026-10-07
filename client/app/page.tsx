"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import { rolePath, useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { user, ready, login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("consumer");
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) {
      router.replace(rolePath(user.role));
    }
  }, [ready, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const u =
        mode === "login"
          ? await login(email, password)
          : await register({
              name,
              email,
              password,
              role,
              storeName: role === "store" ? storeName : undefined,
            });
      router.replace(rolePath(u.role));
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <Shell title="registro e inicio de sesion">
      <div className="card">
        <div className="row">
          <button className={mode === "login" ? "" : "ghost"} onClick={() => setMode("login")}>
            iniciar sesion
          </button>
          <button className={mode === "register" ? "" : "ghost"} onClick={() => setMode("register")}>
            registrarse
          </button>
        </div>
        <form onSubmit={submit} style={{ marginTop: 16 }}>
          {mode === "register" ? (
            <div style={{ marginBottom: 10 }}>
              <input
                placeholder="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          ) : null}
          <div style={{ marginBottom: 10 }}>
            <input
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {mode === "register" ? (
            <div style={{ marginBottom: 10 }}>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="consumer">consumer</option>
                <option value="store">store</option>
                <option value="delivery">delivery</option>
              </select>
            </div>
          ) : null}
          {mode === "register" && role === "store" ? (
            <div style={{ marginBottom: 10 }}>
              <input
                placeholder="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>
          ) : null}
          <button type="submit">{mode === "login" ? "entrar" : "crear cuenta"}</button>
          {error ? <p className="err">{error}</p> : null}
        </form>
      </div>
    </Shell>
  );
}
