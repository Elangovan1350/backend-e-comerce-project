import { prisma } from "../index.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Nodemailer from "nodemailer";
import * as z from "zod";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

export const forgotPasswordRoutes = new Hono();
export const resetPasswordRoutes = new Hono();

const transport = Nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "elangovan2019miss@gmail.com",
    pass: `${process.env.email_api_key}`,
  },
});

// Schema for reset password
const resetPasswordSchema = z.object({
  email: z.email(" Invalid email address"),
  newPassword: z
    .string()
    .min(6, " Password must be at least 6 characters long")
    .max(30, " Password must be at most 30 characters long"),
  token: z.string().min(1, " Token is required"),
});

// Schema for forgot password
const forgotPasswordSchema = z.object({
  email: z.email(" Invalid email address"),
});

// Middleware to validate request body for registration and login routes

const saltRounds = 10;

// function to create JWT token
const createToken = (email: string) => {
  const JWT_SECRET = `${process.env.jwt_secret_key}`;
  const payload = { email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
};

// Middleware to handle validation errors for forgot password route
forgotPasswordRoutes.use(
  "/",
  zValidator("json", forgotPasswordSchema, (result, c) => {
    if (!result.success && "error" in result) {
      const messages = result.error.issues.map((e) => e.message);
      return c.json({ success: false, message: messages }, 200);
    }
    return;
  })
);

// forgot password route
forgotPasswordRoutes.post("/", async (c) => {
  try {
    const { email } = await c.req.json();
    const user = await prisma.users.findUnique({
      where: { email },
    });
    if (!user) {
      return c.json(
        { message: " email is not registered ", success: false },
        200
      );
    }
    const token = createToken(email);

    // const sender = {
    //   address: "elangovan2019miss@gmail.com",

    //   name: "Reset password token",
    // };
    // const recipients = [email];
    //
    await transport
      .sendMail({
        from: "elangovan2019miss@gmail.com",
        to: [email],
        subject: "Reset password token",
        text: "click the link to reset your password",

        html: `<p>Click <a href="https://frontend-ecommerce-project.vercel.app/user/resetPassword?token=${token}">here</a> to reset your password</p>`,
      })
      .then((e) => {
        if (e.accepted.length > 0) {
          console.log("Email sent successfully to: ", e.accepted);
        } else {
          console.log("Email sending failed: ", e.rejected);
          return c.json(
            {
              message: "failed to send email press forget password again",
              success: false,
            },
            200
          );
        }
      });

    return c.json(
      {
        message: "password reset token generated successfully",
        success: true,
      },
      200
    );

    // Here you would typically generate a password reset token and send it via email.
    // Send email with token (implementation not shown)
  } catch (error) {
    console.log(error);
    return c.json({
      message: "server error user can't reset password ",
      success: false,
    });
  }
});

const verifyToken = (token: string) => {
  const JWT_SECRET = `${process.env.jwt_secret_key}`;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Middleware to handle validation errors for reset password route
resetPasswordRoutes.use(
  "/",
  zValidator("json", resetPasswordSchema, (result, c) => {
    if (!result.success && "error" in result) {
      const messages = result.error.issues.map((e) => e.message);
      return c.json({ success: false, message: messages }, 200);
    }
    return;
  })
);
// reset password route

resetPasswordRoutes.post("/", async (c) => {
  try {
    const { email, newPassword, token } = await c.req.json();
    // Here you would typically verify the token (implementation not shown)
    const decoded = verifyToken(token);
    if ((decoded as any).email !== email) {
      return c.json(
        { message: "invalid token email mismatch", success: false },
        400
      );
    }
    if (!decoded) {
      return c.json(
        { message: "invalid or expired token", success: false },
        400
      );
    }
    console.log(decoded);

    const hash = bcrypt.hashSync(newPassword, saltRounds);

    const updatedUser = await prisma.users.update({
      where: { email },
      data: { password: hash },
    });

    return c.json(
      {
        message: "password reset successfully",
        success: true,
      },
      200
    );
  } catch (error) {
    console.log(error + " error resetting password");
    return c.json(
      { message: "server error password can't be reset ", success: false },
      501
    );
  }
});
