import { zValidator } from "@hono/zod-validator";
import { prisma, userRoutes } from "../index.js";
import * as z from "zod";
import bcrypt from "bcryptjs";

const saltRounds = 10;

// Zod schemas for validation
const userSchema = z.object({
  email: z.email(" Invalid email address"),
  name: z
    .string()
    .min(2, " Name must be at least 2 characters long")
    .max(100, " Name must be at most 100 characters long"),
  password: z
    .string()
    .min(6, " Password must be at least 6 characters long")
    .max(30, " Password must be at most 30 characters long"),
  phone: z
    .string()
    .min(10, " Phone number must be at least 10 characters long")
    .max(15, " Phone number must be at most 15 characters long"),
});
// Middleware to handle validation errors for registration route
userRoutes.use(
  "/register",
  zValidator("json", userSchema, (result, c) => {
    if (!result.success && "error" in result) {
      const messages = result.error.issues.map((e) => e.message);
      return c.json({ success: false, message: messages }, 200);
    }
    return;
  })
);

// register route

userRoutes.post("/register", zValidator("json", userSchema), async (c) => {
  try {
    const { name, email, password, phone } = await c.req.json();

    const hash = bcrypt.hashSync(password, saltRounds);

    const newUser = await prisma.users.create({
      data: {
        email,
        name,
        password: hash,
        phone,
      },
    });

    return c.json(
      {
        data: newUser,
        message: "user regestered successfully",
        success: true,
      },
      200
    );
  } catch (error) {
    const { email } = await c.req.json();

    const emailExistAlready = await prisma.users.findUnique({
      where: { email },
    });
    if (emailExistAlready) {
      return c.json({ message: "email already exist ", success: false });
    }
    return c.json(
      { message: "server error user cann't register ", success: false },
      501
    );
  }
});
