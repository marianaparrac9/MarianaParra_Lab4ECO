import { Router } from "express";
import { allowRoles, auth, AuthRequest } from "../middleware/auth";
import { createProduct, updateProductName } from "../services/productService";

const router = Router();

router.post("/", auth, allowRoles(["store"]), async (req: AuthRequest, res) => {
  try {
    const product = await createProduct(req.user!.id, req.body.name, Number(req.body.price));
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/:id", auth, allowRoles(["store"]), async (req: AuthRequest, res) => {
  try {
    const product = await updateProductName(req.user!.id, req.params.id, req.body.name);
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
