import { Hono } from 'hono';
import { AppEnv } from './types';

const app = new Hono<AppEnv>();

app.post('/embedding/ingest', async (c) => {
  const { docs } = await c.req.json<{
    docs: Array<{ id: string; text: string; source?: string }>;
  }>();

  const embeddingRes: Record<string, any> = await c.env.AI.run(
    '@cf/baai/bge-base-en-v1.5',
    {
      text: docs.map((doc) => doc.text),
    },
  );

  const vectors = docs.map((doc, i) => ({
    id: doc.id,
    values: embeddingRes.data[i],
    metadata: {
      text: doc.text,
      source: doc.source || 'unknown',
      insertedAt: Date.now(),
    },
  }));

  const result = await c.env.DOCS_INDEX.upsert(vectors);

  return c.json({ message: 'OK', result }, 201);
});

app.post('/embedding/search', async (c) => {
  const { question } = await c.req.json();
  const embeddingRes: Record<string, any> = await c.env.AI.run(
    '@cf/baai/bge-base-en-v1.5',
    {
      text: question,
    },
  );

  const result = await c.env.DOCS_INDEX.query(embeddingRes.data[0], {
    topK: 2,
    returnMetadata: 'all',
  });

  const context = result.matches
    .map((m, i) => `[${i + 1}] ${m.metadata?.text}`)
    .join('\n\n');

  const systemPrompt = `你是一个根据提供的上下文回答问题的助手。
只使用下面的上下文回答。如果上下文里没有答案，就回复"根据现有资料无法回答"。

上下文：
${context}`;

  const llmRes = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
  });

  return c.json({ message: 'OK', answer: llmRes.response }, 201);
});

export default app;
