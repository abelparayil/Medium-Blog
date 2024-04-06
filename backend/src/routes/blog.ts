import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { verify } from 'hono/jwt';
import { createBlogSchema, updateBlogSchema } from '@abelparayil/medium-common';

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use('/*', async (c, next) => {
  const header = c.req.header('authorization');

  try {
    if (header) {
      const decoded = await verify(header, c.env.JWT_SECRET);
      c.set('userId', decoded.id);
      await next();
    } else {
      return c.json({ message: 'Forbidden' }, 403);
    }
  } catch {
    return c.json({ message: "You're not logged in" }, 403);
  }
});

blogRouter.post('/', async (c) => {
  const body = await c.req.json();
  const userIdObject = c.get('userId');
  const userId = userIdObject;
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const { success } = createBlogSchema.safeParse(body);

  if (!success) {
    return c.json({ message: 'Invalid input' }, 400);
  }

  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: userId,
    },
  });
  console.log(post);
  return c.json({
    id: post.id,
    title: post.title,
  });
});

blogRouter.put('/', async (c) => {
  const body = await c.req.json();
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const { success } = updateBlogSchema.safeParse(body);

  if (!success) {
    return c.json({ message: 'Invalid input' }, 400);
  }

  const post = await prisma.post.update({
    where: {
      id: body.id,
    },
    data: {
      title: body.title,
      content: body.content,
    },
  });
  return c.json({
    id: post.id,
    title: post.title,
  });
});

blogRouter.get('/bulk', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const posts = await prisma.post.findMany();

  return c.json(posts);
});

blogRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const post = await prisma.post.findFirst({
      where: {
        id: id,
      },
    });
    if (post) {
      return c.json({
        id: post.id,
        title: post.title,
        content: post.content,
      });
    }
  } catch (error) {
    c.status(411);
    return c.json({ message: 'Post not found' });
  }
});
