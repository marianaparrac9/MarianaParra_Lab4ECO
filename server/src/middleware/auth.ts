import { NextFunction, Request, Response } from "express";
import { pool } from "../db";
import { supabaseClient } from "../supabase";

export type AuthUser = {
  id: string;
  role: string;
  name: string;
  email: string;
};

export type AuthRequest = Request & { user?: AuthUser };

export async function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "no autorizado" });
  }

  const token = header.replace("Bearer ", "");
  try {
    const { data, error } = await supabaseClient().auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: "token invalido" });
    }

    const result = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [
      data.user.id,
    ]);
    if (!result.rows[0]) {
      return res.status(401).json({ error: "usuario no encontrado" });
    }

    req.user = result.rows[0];
    next();
  } catch {
    return res.status(401).json({ error: "token invalido" });
  }
}

export function allowRoles(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "no tienes permiso" });
    }
    next();
  };
}
