import { ChatOpenAI } from '@langchain/openai';
import { createReminder, getWeather } from './tools';
import { createAgent } from 'langchain';
import { CallbackHandler } from '@langfuse/langchain';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { LangfuseSpanProcessor } from '@langfuse/otel';

const sdk = new NodeSDK({
  spanProcessors: [new LangfuseSpanProcessor()],
});

sdk.start();

const model = new ChatOpenAI({
  apiKey: process.env.API_KEY,
  model: process.env.MODEL,
  configuration: {
    baseURL: process.env.BASE_URL,
  },
  modelKwargs: {
    thinking: {
      type: 'disabled',
    },
  },
});

const langfuseHandler = new CallbackHandler({
  sessionId: 'session_20260331_01',
  userId: 'user_2048',
  tags: ['single-agent', 'weather-flow'],
});

const agent = createAgent({
  model,
  tools: [getWeather, createReminder],
  systemPrompt: '你是用户的生活助理，能聊天，也能在必要时调用工具。',
});

const result = await agent.invoke(
  {
    messages: [
      {
        role: 'user',
        content:
          '帮我看看明天上海天气。如果下雨就提醒我带伞，再把结果顺手发给我。',
      },
    ],
  },
  {
    callbacks: [langfuseHandler],
  },
);

console.log(result.messages.at(-1)?.text);

await sdk.shutdown();
