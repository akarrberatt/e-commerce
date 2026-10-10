import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { PUBLIC_DIR } from "./config/paths.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { brandsRouter } from "./modules/brands/brands.routes.js";
import { categoriesRouter } from "./modules/categories/categories.routes.js";
import { favoritesRouter } from "./modules/favorites/favorites.routes.js";
import { productsRouter } from "./modules/products/products.routes.js";
import { reviewsRouter } from "./modules/reviews/reviews.routes.js";
import { searchRouter } from "./modules/search/search.routes.js";
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

// Ürün görselleri: backend/public → /static (ör. /static/products/x.jpg). Dizin listeleme yoktur;
// dosya olmayan yollar aşağıdaki notFound'a düşer.
app.use(
  "/static",
  express.static(PUBLIC_DIR, {
    index: false,
    redirect: false,
    maxAge: "7d", // Cache-Control: public, max-age=604800
    setHeaders: (res) => {
      // helmet'in varsayılanı same-origin; frontend (farklı origin) görselleri yükleyebilsin diye
      // yalnızca statik dosyalarda gevşetilir.
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  }),
);

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
api.use("/brands", brandsRouter);
api.use("/search", searchRouter);

app.use("/api", api);

app.use(notFound);
app.use(errorHandler);
