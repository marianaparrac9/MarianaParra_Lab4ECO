import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db";

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

  const hashed = await bcrypt.hash(password, 10);
  const userRes = await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
    [name, email, hashed, role]
  );
  const user = userRes.rows[0];

  if (role === "store") {
    await pool.query(
      "INSERT INTO stores (name, is_open, user_owner_id) VALUES ($1, false, $2)",
      [storeName, user.id]
    );
  }

  return { user, token: makeToken(user) };
}

export async function loginUser(email: string, password: string) {
  if (!email || !password) {
    throw new Error("faltan datos");
  }

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];
  if (!user) {
    throw new Error("correo o clave incorrectos");
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw new Error("correo o clave incorrectos");
  }

  const safe = { id: user.id, name: user.name, email: user.email, role: user.role };
  return { user: safe, token: makeToken(safe) };
}

function makeToken(user: { id: string; name: string; email: string; role: string }) {
  return jwt.sign(user, process.env.JWT_SECRET as string, { expiresIn: "2d" });
}
