import { Hono } from 'hono';
import { AppEnv } from './types';
import { drizzle } from 'drizzle-orm/d1';
import { HTTPException } from 'hono/http-exception';
import { posts, users } from './db/schema';
import * as schema from './db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono<AppEnv>();

app.get('/drizzle/user', async (c) => {
  const db = drizzle(c.env.MY_DRIZZLE_DB, { schema });
  // const allUsers = await db.select().from(users).all();
  // const allUsers = await db
  //   .select()
  //   .from(users)
  //   .rightJoin(posts, eq(posts.authorId, users.id))
  //   .all();
  const allUsers = await db.query.users.findMany({
    with: {
      posts: true,
    },
  });

  return c.json(allUsers);
});

app.get('/drizzle/user/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = drizzle(c.env.MY_DRIZZLE_DB);
  const user = await db.select().from(users).where(eq(users.id, id)).get();

  if (!user) {
    throw new HTTPException(404, { message: 'User not found' });
  }

  return c.json(user);
});

app.post('/drizzle/user', async (c) => {
  const { name, email } = await c.req.json();
  const db = drizzle(c.env.MY_DRIZZLE_DB);
  const newUser = await db
    .insert(users)
    .values({ name, email })
    .returning()
    .get();

  return c.json(newUser);
});

app.put('/drizzle/user', async (c) => {
  const { name, email, id } = await c.req.json();
  const db = drizzle(c.env.MY_DRIZZLE_DB);
  const updated = await db
    .update(users)
    .set({ name, email })
    .where(eq(users.id, id))
    .returning()
    .get();

  if (!updated) {
    throw new HTTPException(404, { message: 'User not found' });
  }

  return c.json(updated);
});

app.delete('/drizzle/user/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = drizzle(c.env.MY_DRIZZLE_DB);
  const deleted = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning()
    .get();

  if (!deleted) {
    throw new HTTPException(404, { message: 'User not found' });
  }

  return c.json({ message: `User ${id} deleted`, user: deleted });
});

// posts ================================
app.get('/drizzle/post', async (c) => {
  const db = drizzle(c.env.MY_DRIZZLE_DB, { schema });
  // const allPosts = await db.select().from(posts).all();
  const allPosts = await db.query.posts.findMany({
    with: {
      author: true,
    },
  });

  return c.json(allPosts);
});

app.get('/drizzle/post/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = drizzle(c.env.MY_DRIZZLE_DB);
  const post = await db.select().from(posts).where(eq(posts.id, id)).get();

  if (!post) {
    throw new HTTPException(404, { message: 'Post not found' });
  }

  return c.json(post);
});

app.post('/drizzle/post', async (c) => {
  const { title, content, authorId } = await c.req.json();
  const db = drizzle(c.env.MY_DRIZZLE_DB);
  const newPost = await db
    .insert(posts)
    .values({ title, content, authorId })
    .returning()
    .get();

  return c.json(newPost);
});

app.put('/drizzle/post', async (c) => {
  const { title, content, id } = await c.req.json();
  const db = drizzle(c.env.MY_DRIZZLE_DB);
  const updated = await db
    .update(posts)
    .set({ title, content })
    .where(eq(posts.id, id))
    .returning()
    .get();

  if (!updated) {
    throw new HTTPException(404, { message: 'Post not found' });
  }

  return c.json(updated);
});

app.delete('/drizzle/post/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = drizzle(c.env.MY_DRIZZLE_DB);
  const deleted = await db
    .delete(posts)
    .where(eq(posts.id, id))
    .returning()
    .get();

  if (!deleted) {
    throw new HTTPException(404, { message: 'Post not found' });
  }

  return c.json({ message: `Post ${id} deleted`, post: deleted });
});

export default app;
