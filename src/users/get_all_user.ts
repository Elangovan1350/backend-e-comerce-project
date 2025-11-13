import { prisma, userRoutes } from "../index.js";

// get all users route
userRoutes.get("/", async (c) => {
  const users = await prisma.users.findMany({
    include: { posts: true },
  });
  return c.json(
    { data: users, message: "all users fetched successfully", success: true },
    200
  );
});
