import { Hono } from 'hono';
import { cache } from 'hono/cache';
import { AppEnv } from './types';

const app = new Hono<AppEnv>();

app.get('/cache/a', async (c) => {
  const key = new Request(c.req.url, {
    method: 'GET',
  });

  const cached = await caches.default.match(key);
  if (cached) return cached;

  const response = c.json(
    {
      message: 'OK',
      count: Math.random(),
    },
    200,
    {
      'Cache-Control': 'public, max-age=10',
    },
  );

  c.executionCtx.waitUntil(caches.default.put(key, response.clone()));

  return response;
});

app.get(
  '/cache/b',
  cache({
    cacheName: 'cache-b',
    cacheControl: 'max-age=10',
  }),
  async (c) => {
    return c.json(
      {
        message: 'OK',
        count: Math.random(),
      },
      200,
    );
  },
);

export default app;
