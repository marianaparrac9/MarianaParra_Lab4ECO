import { pool } from "../db";
import { supabaseClient } from "../supabase";

const roles = ["consumer", "store", "delivery"];

export async function registerUser(body: {
  name: string;
  email: string;
  password: string;
  role: string;
  storeName?: string;
}) {
  const { name, email, password, role, storeName } = body;

  if (!name || !email || !password || !role) {
    throw new Error("faltan datos");
  }
  if (!roles.includes(role)) {
    throw new Error("rol invalido");
  }
  if (role === "store" && !storeName) {
    throw new Error("el nombre de la tienda es obligatorio");
  }

  const exists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (exists.rows.length) {
    throw new Error("el correo ya esta registrado");
  }

  const { data, error } = await supabaseClient().auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });
  if (error || !data.user) {
    throw new Error(error?.message || "no se pudo crear el usuario");
  }

  await pool.query("INSERT INTO users (id, name, email, role) VALUES ($1, $2, $3, $4)", [
    data.user.id,
    name,
    email,
    role,
  ]);

  if (role === "store") {
    await pool.query(
      "INSERT INTO stores (name, is_open, user_owner_id) VALUES ($1, false, $2)",
      [storeName, data.user.id]
    );
  }

  return loginUser(email, password);
}

export async function loginUser(email: string, password: string) {
  if (!email || !password) {
    throw new Error("faltan datos");
  }

  const { data, error } = await supabaseClient().auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error("correo o clave incorrectos");
  }

  const result = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [
    data.user.id,
  ]);
  const user = result.rows[0];
  if (!user) {
    throw new Error("usuario no encontrado");
  }

  return { user, token: data.session.access_token };
}
