import { Router } from "express";
import { allowRoles, auth, AuthRequest } from "../middleware/auth";
import {
  acceptOrder,
  createOrder,
  deliverOrder,
  getAvailableOrders,
  getDeliveryHistory,
  getOrderById,
  getOrdersByClient,
  getOrdersByStore,
  rejectOrder,
} from "../services/orderService";
import { getStoreByOwner } from "../services/storeService";

const router = Router();

router.post("/", auth, allowRoles(["consumer"]), async (req: AuthRequest, res) => {
  try {
    const order = await createOrder(req.user!.id, req.body.store_id, req.body.items);
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/mine", auth, allowRoles(["consumer"]), async (req: AuthRequest, res) => {
  try {
    const orders = await getOrdersByClient(req.user!.id);
    res.json(orders);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/store", auth, allowRoles(["store"]), async (req: AuthRequest, res) => {
  try {
    const orders = await getOrdersByStore(req.user!.id);
    res.json(orders);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/available", auth, allowRoles(["delivery"]), async (_req, res) => {
  try {
    const orders = await getAvailableOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/delivery/history", auth, allowRoles(["delivery"]), async (req: AuthRequest, res) => {
  try {
    const orders = await getDeliveryHistory(req.user!.id);
    res.json(orders);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:id", auth, allowRoles(["delivery", "consumer", "store"]), async (req: AuthRequest, res) => {
  try {
    const order = await getOrderById(req.params.id);
    const user = req.user!;

    if (user.role === "consumer" && order.client_id !== user.id) {
      return res.status(403).json({ error: "no tienes permiso" });
    }

    if (user.role === "store") {
      const store = await getStoreByOwner(user.id);
      if (!store || store.id !== order.store_id) {
        return res.status(403).json({ error: "no tienes permiso" });
      }
    }

    if (user.role === "delivery") {
      if (order.delivery_id && order.delivery_id !== user.id) {
        return res.status(400).json({ error: "la orden ya fue aceptada por otro domiciliario" });
      }
      const disponible = !order.delivery_id && order.status === "waiting_for_deliver";
      const mia = order.delivery_id === user.id;
      if (!mia && !disponible) {
        return res.status(403).json({ error: "no tienes permiso" });
      }
    }

    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/accept", auth, allowRoles(["delivery"]), async (req: AuthRequest, res) => {
  try {
    const order = await acceptOrder(req.user!.id, req.params.id);
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/reject", auth, allowRoles(["delivery"]), async (req: AuthRequest, res) => {
  try {
    const order = await rejectOrder(req.user!.id, req.params.id);
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/deliver", auth, allowRoles(["delivery"]), async (req: AuthRequest, res) => {
  try {
    const order = await deliverOrder(req.user!.id, req.params.id);
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
