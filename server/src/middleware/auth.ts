import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthUser = {
  id: string;
  role: string;
  name: string;
  email: string;
};

export type AuthRequest = Request & { user?: AuthUser };

export function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "no autorizado" });
  }

  const token = header.replace("Bearer ", "");
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
    req.user = data;
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
