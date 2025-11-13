import { zValidator } from "@hono/zod-validator";
import { prisma, userRoutes } from "../index.js";
import * as z from "zod";
import bcrypt from "bcryptjs";
import { Hono } from "hono";

const saltRounds = 10;

// Schema for change password
const changePasswordSchema = z.object({
  email: z.email(" Invalid email address"),
  newPassword: z
    .string()
    .min(6, " Password must be at least 6 characters long")
    .max(30, " Password must be at most 30 characters long"),
  password: z
    .string()
    .min(6, " Current Password must be at least 6 characters long")
    .max(30, " Current Password must be at most 30 characters long"),
});

// Middleware to handle validation errors for change password route
userRoutes.use(
  "/change-password",
  zValidator("json", changePasswordSchema, (result, c) => {
    if (!result.success && "error" in result) {
      const messages = result.error.issues.map((e) => e.message);
      return c.json({ success: false, message: messages }, 200);
    }
    return;
  })
);
// change password route

userRoutes.post("/change-password", async (c) => {
  try {
    const { email, newPassword, password } = await c.req.json();
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
          message: "invalid current password",
          success: compare,
        },
        200
      );
    }

    const hash = bcrypt.hashSync(newPassword, saltRounds);

    const updatedUser = await prisma.users.update({
      where: { email },
      data: { password: hash },
    });

    return c.json(
      {
        message: "password updated successfully",
        success: true,
      },
      200
    );
  } catch (error) {
    console.log(error + " error updating password");
    return c.json(
      { message: "server error password cann't be updated ", success: false },
      501
    );
  }
});
