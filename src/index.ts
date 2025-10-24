import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
const prisma = new PrismaClient();
const app = new Hono();

const resend = new Resend(process.env.resend_email_api_key);

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

// register route

app.post("/register", async (c) => {
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
  const JWT_SECRET =
    "lkfdklf8u58925584512dsfew$#@%@df4ds65fefjewi651$#^sfds4f$%#$t";
  const payload = { email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
};

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

    // Here you would typically generate a password reset token and send it via email.
    const token = createToken(email);
    // Send email with token (implementation not shown)
    resend.emails.send({
      from: "elangov@example.com",
      to: email,
      subject: "Password Reset",
      html: `<p>Click <a href="https://frontend-ecommerce-project.vercel.app/reset-password?token=${token}">here</a> to reset your password.</p>`,
    });
    return c.json({
      message: "password reset email sent successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return c.json({
      message: "server error user can't reset password ",
      success: false,
    });
  }
});

export default app;
