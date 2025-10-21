import { Hono } from "hono";
import { PrismaClient } from "./generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/register", async (c) => {
  const { name, email, password, phone } = await c.req.json();
  const saltRounds = 10;

  const hash = bcrypt.hashSync(password, saltRounds);

  const newUser = await prisma.users.create({
    data: {
      email,
      name,
      password: hash,
      phone,
    },
  });
  return c.json({ data: newUser });
});

app.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  const passwordCheck = await prisma.users.findUnique({
    where: { email },
    select: { password: true },
  });
  if (!passwordCheck) {
    return c.json({ message: "invalid email or password", success: false });
  }
  const compare = bcrypt.compareSync(password, passwordCheck.password);
  if (!compare) {
    return c.json({ message: "invalid email or password", success: compare });
  }
  return c.json({
    success: compare,
    message: "email and password is correct",
  });
});
export default app;
