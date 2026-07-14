import { zValidator } from '@hono/zod-validator';
import z from 'zod';
import { ValidationError } from './error-handler';
import { Hono } from 'hono';

const app = new Hono();

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

app.post(
  '/users',
  zValidator('json', createUserSchema, (result, c) => {
    if (!result.success) {
      throw new ValidationError();
    }
  }),
  (c) => {
    const data = c.req.valid('json');

    return c.json({ id: 1, ...data }, 201);
  },
);

export default app;
