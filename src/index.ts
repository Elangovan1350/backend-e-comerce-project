import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaClient } from "@prisma/client";
import { registerRoutes } from "./users/register.js";
import { loginRoutes } from "./users/login.js";
import { forgotPasswordRoutes } from "./users/forgot_password.js";
import { resetPasswordRoutes } from "./users/forgot_password.js";
import { changePasswordRoutes } from "./users/change_password.js";
import { emailVerifyRoutes } from "./users/email_verify.js";
import { emailVerifyConfirmRoutes } from "./users/email_verify.js";

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
app.route("/register", registerRoutes);
app.route("/login", loginRoutes);
app.route("/forgot-password", forgotPasswordRoutes);
app.route("/reset-password", resetPasswordRoutes);
app.route("/change-password", changePasswordRoutes);

app.route("/email-verify", emailVerifyRoutes);
app.route("/email-verify-confirm", emailVerifyConfirmRoutes);

// get all users route
app.get("/", async (c) => {
  const users = await prisma.users.findMany();
  return c.json(
    { data: users, message: "all users fetched successfully", success: true },
    200
  );
});
export default app;
