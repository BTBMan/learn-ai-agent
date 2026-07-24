import { Hono } from 'hono';
import { AppEnv } from './types';
import { DurableObject } from 'cloudflare:workers';

const app = new Hono<AppEnv>();

export class Counter extends DurableObject {
  async increment(): Promise<number> {
    const current = (await this.ctx.storage.get<number>('count')) ?? 0;
    const next = current + 1;
    await this.ctx.storage.put('count', next);

    return next;
  }

  async get(): Promise<number> {
    return (await this.ctx.storage.get<number>('count')) ?? 0;
  }
}

app.post('/do/enter/:roomId', async (c) => {
  const roomId = await c.req.param('roomId');
  const id = c.env.COUNTER.idFromName(roomId);
  const stub = c.env.COUNTER.get(id);
  const count = await stub.increment();

  console.log(stub);

  return c.json({ message: 'OK', roomId, count, id }, 201);
});

app.post('/do/get/:roomId', async (c) => {
  const roomId = await c.req.param('roomId');
  const id = c.env.COUNTER.idFromName(roomId);
  const stub = c.env.COUNTER.get(id);
  const count = await stub.get();

  return c.json({ message: 'OK', roomId, count, id }, 201);
});

export default app;
