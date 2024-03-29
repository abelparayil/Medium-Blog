import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { decode, sign, verify } from 'hono/jwt';

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

app.use('/api/v1/blog/*', async (c, next) => {
  const header = c.req.header('authorization');

  if (header) {
    const token = header.split(' ')[1];
    const decoded = await verify(token, c.env.JWT_SECRET);

    if (decoded) {
      return next();
    }
  }

  return c.json({ message: 'Forbidden' }, 403);
});

app.post('/api/v1/user/signup', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  const user = await prisma.user.create({
    data: {
      email: body.email,
      password: body.password,
    },
  });

  const token = await sign({ id: user.id }, c.env.JWT_SECRET);

  return c.json({ jwt: token });
});

app.post('/api/v1/user/signin', async (c) => {
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
    return c.json({ message: 'User not found' });
  }

  const valid = String(user.password) === String(body.password);

  if (!valid) {
    return c.json({ message: 'Invalid password' });
  }

  const token = await sign({ id: user.id }, c.env.JWT_SECRET);

  return c.json({ jwt: token });
});

app.post('/api/v1/blog', (c) => {
  return c.json({ message: 'Blog created' });
});

app.put('/api/vi/blog', (c) => {
  return c.json({ message: 'Blog updated' });
});

app.get('/api/v1/blog/:id', (c) => {
  return c.json({ message: 'Blog fetched' });
});

export default app;
