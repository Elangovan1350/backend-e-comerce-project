import { Hono } from "hono";

import { postRoutes, prisma } from "../index.js";

// get all posts route
postRoutes.get("/", async (c) => {
  const posts = await prisma.posts.findMany();
  return c.json({ data: posts, message: "get all the posts" }, 200);
});

// get post by id route
postRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const post = await prisma.posts.findUnique({
    where: { id },
  });
  return c.json({ data: post, message: "get post by id" }, 200);
});

// create post route
postRoutes.post("/", async (c) => {
  const { title, content, authorId } = await c.req.json();
  const createPost = await prisma.posts.create({
    data: {
      title,
      content,
      authorId,
    },
  });
  return c.json(
    { data: createPost, message: "created post successfully " },
    200
  );
});

// update post route
postRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const { title, content } = await c.req.json();
  const updatePost = await prisma.posts.update({
    where: { id },
    data: {
      title,
      content,
    },
  });
  return c.json(
    { data: updatePost, message: "updated post successfully" },
    200
  );
});

// delete post route
postRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const deletePost = await prisma.posts.delete({
    where: { id },
  });
  return c.json(
    { data: deletePost, message: "deleted post successfully" },
    200
  );
});
