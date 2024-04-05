import { Hono } from 'hono';
import { userRouter } from './routes/user';
import { blogRouter } from './routes/blog';

const app = new Hono();

// app.use('/api/v1/blog/*', async (c, next) => {
//   const header = c.req.header('authorization');

//   if (header) {
//     const token = header.split(' ')[1];
//     const decoded = await verify(token, c.env.JWT_SECRET);

//     if (decoded) {
//       return next();
//     }
//   }

//   return c.json({ message: 'Forbidden' }, 403);
// });

app.route('/api/v1/user/', userRouter);
app.route('/api/v1/blog/', blogRouter);

export default app;
