import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaClient } from "@prisma/client";
import { postRoutes } from "./posts/index.js";
import { userRoutes } from "./users/get_all_user.js";
import { userRoutes1 } from "./users/register.js";
import { userRoutes2 } from "./users/login.js";
import { userRoutes3 } from "./users/forgot_password.js";
import { userRoutes4 } from "./users/email_verify.js";
import { userRoutes5 } from "./users/change_password.js";

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

// Importing user routes
app.route("/", userRoutes);
app.route("/", userRoutes1);
app.route("/", userRoutes2);
app.route("/", userRoutes3);
app.route("/", userRoutes4);
app.route("/", userRoutes5);

// Importing post routes
app.route("/posts", postRoutes);

export default app;
