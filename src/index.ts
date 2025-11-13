import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
const app = new Hono();
// CORS configuration
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "https://frontend-ecommerce-project.vercel.app",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);
export const userRoutes = app;
export const postRoutes = app;

// Importing user routes
app.route("/", userRoutes);
app.route("/posts", postRoutes);

export default app;
