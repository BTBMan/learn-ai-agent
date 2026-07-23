import { Hono } from 'hono';
import error from './error';
import jwt from './jwt';
import users from './users';
import kv from './kv';
import d1 from './d1';
import drizzle from './drizzle';
import r2 from './r2';
import rpc from './rpc';
import stream from './stream';
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
app.route('/', r2);
app.route('/', stream);

const rpcRouter = app.route('/', rpc);

export type RPCType = typeof rpcRouter;

export default app;
