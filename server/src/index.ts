import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import { initDB } from "./db";
import authRoutes from "./routes/auth";
import orderRoutes from "./routes/orders";
import productRoutes from "./routes/products";
import storeRoutes from "./routes/stores";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

const port = Number(process.env.PORT || 4000);

initDB()
  .then(() => {
    app.listen(port, () => {
      console.log("server on " + port);
    });
  })
  .catch((err) => {
    console.log("db error", err);
    process.exit(1);
  });
