import { Router } from "express";
import { loginUser, registerUser } from "../services/authService";
import { auth, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const data = await registerUser(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const data = await loginUser(req.body.email, req.body.password);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/me", auth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;
