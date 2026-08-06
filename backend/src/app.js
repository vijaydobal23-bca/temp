import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import cartRoutes from "./routes/cart.routes.js";

import morgan from "morgan";



const app = express();
app.use(morgan("dev"));

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);



app.get("/api", (req, res) => {
  res.json({ success: true, message: "ECOM API is running 🚀" });
});




// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
