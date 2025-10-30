import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Nodemailer from "nodemailer";
import * as z from "zod";
import { zValidator } from "@hono/zod-validator";

const prisma = new PrismaClient();
const app = new Hono();

const transport = Nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "elangovan2019miss@gmail.com",
    pass: `${process.env.email_api_key}`,
  },
});

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
const loginSchema = z.object({
  email: z.email(" Invalid email address"),
  password: z
    .string()
    .min(6, " Password must be at least 6 characters long")
    .max(100, " Password must be at most 100 characters long"),
});

const resetPasswordSchema = z.object({
  email: z.email(" Invalid email address"),
  newPassword: z
    .string()
    .min(6, " Password must be at least 6 characters long")
    .max(30, " Password must be at most 30 characters long"),
  token: z.string().min(1, " Token is required"),
});
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

const forgotPasswordSchema = z.object({
  email: z.email(" Invalid email address"),
});

// Middleware to validate request body for registration and login routes

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
const saltRounds = 10;

// get all users route
app.get("/", async (c) => {
  const users = await prisma.users.findMany();
  return c.json(
    { data: users, message: "all users fetched successfully", success: true },
    200
  );
});

// Middleware to handle validation errors for registration route
app.use(
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

app.post("/register", zValidator("json", userSchema), async (c) => {
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

// Middleware to handle validation errors for login route
app.use(
  "/login",
  zValidator("json", loginSchema, (result, c) => {
    if (!result.success && "error" in result) {
      const messages = result.error.issues.map((e) => e.message);
      return c.json({ success: false, message: messages }, 200);
    }
    return;
  })
);
// login route
app.post("/login", async (c) => {
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

// Middleware to handle validation errors for change password route
app.use(
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

app.post("/change-password", async (c) => {
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

// function to create JWT token
const createToken = (email: string) => {
  const JWT_SECRET = `${process.env.jwt_secret_key}`;
  const payload = { email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
};

// Middleware to handle validation errors for forgot password route
app.use(
  "/forgot-password",
  zValidator("json", forgotPasswordSchema, (result, c) => {
    if (!result.success && "error" in result) {
      const messages = result.error.issues.map((e) => e.message);
      return c.json({ success: false, message: messages }, 200);
    }
    return;
  })
);

// forgot password route
app.post("/forgot-password", async (c) => {
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
app.use(
  "/reset-password",
  zValidator("json", resetPasswordSchema, (result, c) => {
    if (!result.success && "error" in result) {
      const messages = result.error.issues.map((e) => e.message);
      return c.json({ success: false, message: messages }, 200);
    }
    return;
  })
);
// reset password route

app.post("/reset-password", async (c) => {
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

app.post("/email-verify", async (c) => {
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

    await transport
      .sendMail({
        from: "elangovan2019miss@gmail.com",
        to: [email],
        subject: "Email Verification",
        text: "click the link to verify your email",

        html: `<p>Click <a href="https://frontend-ecommerce-project.vercel.app/user/verifyEmail?token=${token}">here</a> to verify your email</p>`,
      })
      .then((e) => {
        if (e.accepted.length > 0) {
          console.log("Email sent successfully to: ", e.accepted);
        } else {
          console.log("Email sending failed: ", e.rejected);
          return c.json(
            {
              message: "failed to send email press verify again",
              success: false,
            },
            200
          );
        }
      });

    return c.json(
      {
        message: "email verification token generated and sent successfully",
        success: true,
      },
      200
    );
  } catch (error) {
    console.log(error);
    return c.json({
      message: "server error user can't verify email try again later  ",
      success: false,
    });
  }
});

app.post("/email-verify-confirm", async (c) => {
  try {
    const { token } = await c.req.json();

    const decoded = verifyToken(token);
    if (!decoded) {
      return c.json(
        { message: "invalid or expired token try again ", success: false },
        200
      );
    }
    const email = (decoded as any).email;

    const updatedUser = await prisma.users.update({
      where: { email },
      data: { emailVerified: true },
      select: { emailVerified: true, email: true, name: true },
    });

    return c.json(
      {
        message: "email verified successfully",
        success: true,
      },
      200
    );
  } catch (error) {
    console.log(error + " error verifying email");
    return c.json(
      { message: "server error email can't be verified ", success: false },
      200
    );
  }
});

export default app;
