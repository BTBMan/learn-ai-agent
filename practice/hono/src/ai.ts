import { Hono } from 'hono';
import { AppEnv } from './types';

const app = new Hono<AppEnv>();

app.post('/ai', async (c) => {
  const { prompt } = await c.req.json();

  const result = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
    messages: [
      { role: 'system', content: '你是一个中文技术写作助手。' },
      { role: 'user', content: prompt },
    ],
  });

  return c.json({ message: 'OK', result }, 201);
});

app.post('/ai/gateway', async (c) => {
  const { prompt } = await c.req.json();

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${c.env.CF_ACCOUNT_ID}/ai/v1/chat/completions`,
    {
      method: 'post',
      headers: {
        Authorization: `Bearer ${c.env.CF_API_TOKEN}`,
        'Content-Type': 'application/json',
        'cf-aig-gateway-id': c.env.CF_GATEWAY_ID,
        'cf-aig-metadata': JSON.stringify({
          userId: 'user_001',
        }),
      },
      body: JSON.stringify({
        model: '@cf/zai-org/glm-4.7-flash',
        messages: [
          { role: 'system', content: '你是一个中文技术写作助手。' },
          { role: 'user', content: prompt },
        ],
        thinking: {
          type: 'disabled',
        },
      }),
    },
  );
  const result = await response.json();

  return c.json({ message: 'OK', result }, 201);
});

export default app;
