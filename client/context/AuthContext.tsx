"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken } from "../lib/api";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (body: any) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }
    api("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  async function login(email: string, password: string) {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user as User;
  }

  async function register(body: any) {
    const data = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user as User;
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("auth");
  return ctx;
}

export function rolePath(role: string) {
  if (role === "consumer") return "/client";
  if (role === "store") return "/store-admin";
  if (role === "delivery") return "/delivery";
  return "/";
}
