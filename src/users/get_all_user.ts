import { Hono } from "hono";
import { prisma } from "../index.js";
export const getAllUserRoutes = new Hono();

// get all users route
getAllUserRoutes.get("/", async (c) => {
  const users = await prisma.users.findMany();
  return c.json(
    { data: users, message: "all users fetched successfully", success: true },
    200
  );
});
