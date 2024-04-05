import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { verify } from 'hono/jwt';

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

  if (header) {
    const decoded = await verify(header, c.env.JWT_SECRET);
    c.set('userId', decoded.id);
    await next();
  } else {
    return c.json({ message: 'Forbidden' }, 403);
  }
});

blogRouter.post('/', async (c) => {
  const body = await c.req.json();
  const userIdObject = c.get('userId');
  const userId = userIdObject;
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

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

blogRouter.get('/', async (c) => {
  const body = await c.req.json();
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    console.log('reached here');
    const post = await prisma.post.findFirst({
      where: {
        id: body.id,
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

blogRouter.get('/bulk', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const posts = await prisma.post.findMany();

  return c.json(posts);
});
