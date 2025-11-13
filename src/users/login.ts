import { zValidator } from "@hono/zod-validator";
import { prisma } from "../index.js";
import * as z from "zod";
import bcrypt from "bcryptjs";
import { Hono } from "hono";

const saltRounds = 10;

export const loginRoutes = new Hono();
// Zod schema for login validation

const loginSchema = z.object({
  email: z.email(" Invalid email address"),
  password: z
    .string()
    .min(6, " Password must be at least 6 characters long")
    .max(100, " Password must be at most 100 characters long"),
});

// Middleware to handle validation errors for login route
loginRoutes.use(
  "/",
  zValidator("json", loginSchema, (result, c) => {
    if (!result.success && "error" in result) {
      const messages = result.error.issues.map((e) => e.message);
      return c.json({ success: false, message: messages }, 200);
    }
    return;
  })
);
// login route
loginRoutes.post("/", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const passwordCheck = await prisma.users.findUnique({
      where: { email },
      select: { password: true },
    });
    if (!passwordCheck) {
      return c.json(
        { message: " email is not registered ", success: false },
        200
      );
    }
    const compare = bcrypt.compareSync(password, passwordCheck.password);
    if (!compare) {
      return c.json(
        {
          message: "invalid password",
          success: compare,
        },
        200
      );
    }
    return c.json(
      {
        success: compare,
        message: "email and password is correct",
      },
      200
    );
  } catch (error) {
    console.log(error + " password or email missing");
    return c.json({
      message: "server error user cann't verify user ",
      success: false,
    });
  }
});
