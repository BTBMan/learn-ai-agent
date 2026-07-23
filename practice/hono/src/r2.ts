import { Hono } from 'hono';
import { AppEnv } from './types';
import { HTTPException } from 'hono/http-exception';

const app = new Hono<AppEnv>();

app.get('/r2', async (c) => {
  const prefix = c.req.query('prefix') || '';
  const limit = Number(c.req.query('limit')) || 10;
  const cursor = c.req.query('cursor');

  const listed = await c.env.MY_BUCKET.list({
    cursor,
    limit,
    prefix,
  });

  return c.json({
    objects: listed.objects.map((o) => ({
      key: o.key,
      size: o.size,
      uploaded: o.uploaded,
    })),
    truncated: listed.truncated,
    cursor: listed.truncated ? listed.cursor : undefined,
  });
});

app.get('/r2/:key', async (c) => {
  const key = c.req.param('key');
  const result = await c.env.MY_BUCKET.get(key);

  if (!result) {
    throw new HTTPException(404, { message: 'File not found' });
  }

  c.header(
    'Content-Type',
    result.httpMetadata?.contentType || 'application/octet-stream',
  );

  return c.body(result.body);
});

app.get('/r2/files/*', async (c) => {
  const key = c.req.path.replace('/r2/files/', '');
  const result = await c.env.MY_BUCKET.get(key);

  if (!result) {
    throw new HTTPException(404, { message: 'File not found' });
  }

  c.header(
    'Content-Type',
    result.httpMetadata?.contentType || 'application/octet-stream',
  );
  c.header('Content-Length', result.size.toString());
  c.header('ETag', result.httpEtag);

  // 缓存 1 小时
  c.header('Cache-Control', 'public, max-age=3600');

  return c.body(result.body);
});

app.post('/r2', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    throw new HTTPException(400, { message: 'No file provided' });
  }

  const key = `uploads/${Date.now()}-${file.name}`;

  await c.env.MY_BUCKET.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  });

  return c.json({ key, size: file.size, message: 'uploaded' });
});

app.put('/r2/:key', async (c) => {
  const key = c.req.param('key');
  const body = await c.req.arrayBuffer();

  await c.env.MY_BUCKET.put(key, body, {
    httpMetadata: {
      contentType: c.req.header('Content-Type') || 'application/octet-stream',
    },
  });

  return c.json({ key, message: 'uploaded' });
});

app.delete('/r2/:key', async (c) => {
  const key = c.req.param('key');

  await c.env.MY_BUCKET.delete(key);

  return c.json({ message: `File ${key} deleted` });
});

export default app;
