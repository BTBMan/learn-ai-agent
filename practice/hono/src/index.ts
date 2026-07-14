import { Hono } from 'hono';
import error from './error';
import jwt from './jwt';
import users from './users';
import kv from './kv';
import d1 from './d1';
import drizzle from './drizzle';
import { errorHandler } from './error-handler';

const app = new Hono();

app.onError(errorHandler);

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.route('/', jwt);
app.route('/', users);
app.route('/', error);
app.route('/', kv);
app.route('/', d1);
app.route('/', drizzle);

export default app;
