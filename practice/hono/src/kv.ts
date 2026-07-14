import { Hono } from 'hono';
import { AppEnv } from './types';
import { HTTPException } from 'hono/http-exception';

const app = new Hono<AppEnv>();

const KEY_PREFIX = 'user';

app.get('/kv/:key', async (c) => {
  const key = c.req.param('key');
  const value = await c.env.MY_KV.get(`${KEY_PREFIX}:${key}`, 'json');

  if (!value) {
    throw new HTTPException(404, { message: 'Value not found' });
  }

  const keys = await c.env.MY_KV.list({ prefix: KEY_PREFIX });

  return c.json({ value, keys });
});

app.post('/kv/:key', async (c) => {
  const key = c.req.param('key');
  const body = await c.req.json();

  console.log(body);

  await c.env.MY_KV.put(`${KEY_PREFIX}:${key}`, JSON.stringify(body));

  return c.json({ message: 'Value stored successfully' });
});

app.delete('/kv/:key', async (c) => {
  const key = c.req.param('key');

  await c.env.MY_KV.delete(`${KEY_PREFIX}:${key}`);

  return c.json({ message: 'Value deleted successfully' });
});

export default app;
