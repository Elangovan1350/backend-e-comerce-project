import { prisma, userRoutes } from "../index.js";
import Nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { Hono } from "hono";

const transport = Nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "elangovan2019miss@gmail.com",
    pass: `${process.env.email_api_key}`,
  },
});

// function to create JWT token
const createToken = (email: string) => {
  const JWT_SECRET = `${process.env.jwt_secret_key}`;
  const payload = { email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
};

// function to verify JWT token
const verifyToken = (token: string) => {
  const JWT_SECRET = `${process.env.jwt_secret_key}`;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

// email verify route
userRoutes.post("/email-verify", async (c) => {
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

// email verify confirm route
userRoutes.post("/email-verify-confirm", async (c) => {
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
