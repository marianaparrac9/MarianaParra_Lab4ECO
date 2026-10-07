import { Router } from "express";
import { allowRoles, auth, AuthRequest } from "../middleware/auth";
import { getOpenStores, getStoreById, getStoreByOwner, getStoreProducts, toggleStore } from "../services/storeService";

const router = Router();

router.get("/", auth, allowRoles(["consumer"]), async (_req, res) => {
  try {
    const stores = await getOpenStores();
    res.json(stores);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/mine", auth, allowRoles(["store"]), async (req: AuthRequest, res) => {
  try {
    const store = await getStoreByOwner(req.user!.id);
    res.json(store);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/mine/toggle", auth, allowRoles(["store"]), async (req: AuthRequest, res) => {
  try {
    const store = await toggleStore(req.user!.id);
    res.json(store);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:id/products", auth, allowRoles(["consumer", "store"]), async (req: AuthRequest, res) => {
  try {
    const store = await getStoreById(req.params.id);
    if (!store) {
      return res.status(404).json({ error: "tienda no encontrada" });
    }
    if (req.user!.role === "store" && store.user_owner_id !== req.user!.id) {
      return res.status(403).json({ error: "no tienes permiso" });
    }
    const products = await getStoreProducts(req.params.id);
    res.json(products);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:id", auth, allowRoles(["consumer", "store"]), async (req: AuthRequest, res) => {
  try {
    const store = await getStoreById(req.params.id);
    if (!store) {
      return res.status(404).json({ error: "tienda no encontrada" });
    }
    if (req.user!.role === "store" && store.user_owner_id !== req.user!.id) {
      return res.status(403).json({ error: "no tienes permiso" });
    }
    res.json(store);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
