import { Hono } from 'hono';
import { streamSSE, streamText } from 'hono/streaming';
import { AppEnv } from './types';

const app = new Hono<AppEnv>();

app.get('/stream/text', (c) => {
  return streamText(c, async (stream) => {
    for (const chunk of ['Hello', ' ', 'World', '!']) {
      await stream.write(chunk);
      await stream.sleep(1000);
    }
  });
});

app.get('/stream/sse', (c) => {
  return streamSSE(c, async (stream) => {
    for (const chunk of ['Hello', ' ', 'World', '!']) {
      await stream.writeSSE({
        data: chunk,
        event: 'message',
        id: Date.now().toString(),
      });
      await stream.sleep(1000);
    }
  });
});

app.post('/stream/chat', async (c) => {
  const { messages } = await c.req.json();

  const response = await fetch(`${c.env.AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: c.env.AI_MODEL,
      messages,
      stream: true,
    }),
  });

  return streamSSE(c, async (stream) => {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    let id = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');

      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) {
          continue;
        }

        const data = line.slice(6);
        if (data === '[DONE]') {
          return;
        }

        const parsed = JSON.parse(data);
        const content = parsed.choices[0]?.delta?.content;
        if (content) {
          await stream.writeSSE({
            data: content,
            event: 'message',
            id: String(id++),
          });
        }
      }
    }
  });
});

export default app;
