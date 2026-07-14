import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono();

app.get('/error1', () => {
  throw new HTTPException(404, { message: 'User not found' });
});

app.get('/error2', (c) => {
  const a: { b: string } | undefined = undefined;

  return c.json({
    a: a!.b,
  });
});

export default app;
