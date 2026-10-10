import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { categoriesRouter } from "./modules/categories/categories.routes.js";
import { favoritesRouter } from "./modules/favorites/favorites.routes.js";
import { productsRouter } from "./modules/products/products.routes.js";
import { reviewsRouter } from "./modules/reviews/reviews.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";

export const app = express();

// Reverse proxy (nginx, Render, Railway vb.) arkasında gerçek IP'yi görmek için
// production'da gerekirse: app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL, // "*" credentials ile çalışmaz, açık origin gerekir
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    // OPTIONS ön istekleri cors middleware tarafından otomatik yanıtlanır.
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// Tüm API uçları /api altında: http://localhost:8000/api/...
const api = express.Router();

api.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

api.use("/auth", authRouter);
api.use("/users", usersRouter);
api.use("/categories", categoriesRouter);
api.use("/products", productsRouter);
api.use("/favorites", favoritesRouter);
api.use("/reviews", reviewsRouter);

app.use("/api", api);

app.use(notFound);
app.use(errorHandler);
