import { Hono } from 'hono';
import { AppEnv } from './types';

const app = new Hono<AppEnv>();

app.post('/queue', async (c) => {
  let count = 0;
  while (count < 10) {
    await c.env.RAG_INGEST.send({
      message: `正在处理第 ${count} 条消息`,
    });
    count++;
  }

  return c.json({ message: '已接收, 后台正在处理' }, 202);
});

export default app;
