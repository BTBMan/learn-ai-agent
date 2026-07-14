import { Hono } from 'hono';
import { AppEnv } from './types';
import { HTTPException } from 'hono/http-exception';

const app = new Hono<AppEnv>();

app.get('/d1', async (c) => {
  const { results, success } = await c.env.MY_DB.prepare(
    'SELECT * FROM users ORDER BY created_at DESC',
  ).all();

  if (!success) {
    throw new HTTPException(404, { message: 'Search failed' });
  }

  return c.json(results);
});

app.get('/d1/:id', async (c) => {
  const id = c.req.param('id');
  const user = await c.env.MY_DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first();

  if (!user) {
    throw new HTTPException(404, { message: 'User not found' });
  }

  return c.json(user);
});

app.post('/d1', async (c) => {
  const { name, email } = await c.req.json();
  const result = await c.env.MY_DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?)',
  )
    .bind(name, email)
    .run();

  return c.json({ name, email, id: result.meta.last_row_id });
});

app.put('/d1', async (c) => {
  const { name, email, id } = await c.req.json();
  const result = await c.env.MY_DB.prepare(
    'UPDATE users SET name = ?, email = ? WHERE id = ?',
  )
    .bind(name, email, id)
    .run();

  if (result.meta.changes === 0) {
    throw new HTTPException(404, { message: 'User not found' });
  }

  return c.json({ name, email, id });
});

app.delete('/d1/:id', async (c) => {
  const id = c.req.param('id');
  const result = await c.env.MY_DB.prepare('DELETE FROM users WHERE id = ?')
    .bind(id)
    .run();

  if (result.meta.changes === 0) {
    throw new HTTPException(404, { message: 'User not found' });
  }

  return c.json({ message: `User ${id} deleted` });
});

export default app;
