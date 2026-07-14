import { Hono } from 'hono';
import error from './error';
import jwt from './jwt';
import users from './users';
import { errorHandler } from './error-handler';

const app = new Hono();

app.onError(errorHandler);

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.route('/', jwt);
app.route('/', users);
app.route('/', error);

export default app;
