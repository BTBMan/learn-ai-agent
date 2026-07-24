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
import ai from './ai';
import embedding from './embedding';
import durableObject from './durable-object';
import room from './room';
import queue from './queue';
import { errorHandler } from './error-handler';
import { AppEnv } from './types';

export { Counter } from './durable-object';
export { Room } from './room';

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
app.route('/', ai);
app.route('/', embedding);
app.route('/', durableObject);
app.route('/', room);
app.route('/', queue);

const rpcRouter = app.route('/', rpc);

export type RPCType = typeof rpcRouter;

export default {
  fetch: app.fetch,
  async scheduled(controller, env, ctx) {
    console.log({
      controller,
      env,
      ctx,
    });
  },
  async queue(batch, env, ctx) {
    if (batch.queue === 'rag-ingest') {
      for (const msg of batch.messages) {
        msg.ack();
      }
    }
  },
} satisfies ExportedHandler<AppEnv['Bindings']>;
