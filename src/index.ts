import { Hono } from "hono";
import { PrismaClient } from "./generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const app = new Hono();
const saltRounds = 10;

app.get("/", (c) => {
  return c.text("hello");
});

app.post("/register", async (c) => {
  try {
    const { name, email, password, phone } = await c.req.json();
    const emailExistAlready = await prisma.users.findUnique({
      where: { email },
    });
    if (emailExistAlready) {
      return c.json({ message: "email already exist ", success: false });
    }

    const hash = bcrypt.hashSync(password, saltRounds);

    const newUser = await prisma.users.create({
      data: {
        email,
        name,
        password: hash,
        phone,
      },
    });
    console.log(newUser);

    return c.json(
      {
        data: newUser,
        message: "user regestered successfully",
        success: true,
      },
      200
    );
  } catch (error) {
    console.log(
      error + " email,password,name,phone any one of this is missing"
    );
    return c.json(
      { message: "server error user cann't register ", success: false },
      501
    );
  }
});

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
        401
      );
    }
    const compare = bcrypt.compareSync(password, passwordCheck.password);
    if (!compare) {
      return c.json(
        {
          message: "invalid password",
          success: compare,
        },
        401
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
export default app;
