import { zValidator } from '@hono/zod-validator';
import z from 'zod';
import { Hono } from 'hono';

const app = new Hono();

const paramSchema = z.object({
  id: z.string(),
});

const querySchema = z.object({
  keywords: z.string().min(1),
});

const bodySchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

const rpc = app
  .get(
    '/rpc/?:id',
    zValidator('param', paramSchema),
    zValidator('query', querySchema),
    (c) => {
      const { id } = c.req.valid('param');
      const { keywords } = c.req.valid('query');

      return c.json({ id, keywords }, 201);
    },
  )
  .post('/rpc', zValidator('json', bodySchema), (c) => {
    const data = c.req.valid('json');

    return c.json({ ...data }, 201);
  });

export default rpc;
