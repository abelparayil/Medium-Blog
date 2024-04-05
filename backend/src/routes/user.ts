import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { sign } from 'hono/jwt';

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

// Create a new user: POST /api/v1/user/signup
userRouter.post('/signup', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
      },
    });
  } catch (error) {
    return c.json({ message: 'User already exists' });
  }

  const token = await sign({ id: user.id }, c.env.JWT_SECRET);

  return c.json({ jwt: token });
});

// Sign in a user: POST /api/v1/user/signin
userRouter.post('signin', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });

  if (!user) {
    c.status(403);
    return c.json({ message: 'User not found' });
  }

  const valid = String(user.password) === String(body.password);

  if (!valid) {
    c.status(403);
    return c.json({ message: 'Invalid password' });
  }

  const token = await sign({ id: user.id }, c.env.JWT_SECRET);

  return c.json({ jwt: token });
});

userRouter.get('/getAllUsers', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const users = await prisma.user.findMany();

  return c.json(users);
});
