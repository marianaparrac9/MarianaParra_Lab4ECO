export const API = "http://localhost:4000/api";

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

export async function api(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: any = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = "Bearer " + token;

  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "error");
  }
  return data;
}
