import { ChatOpenAI } from '@langchain/openai';
import { createReminder, getWeather } from './tools';
import { createAgent } from 'langchain';

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
    tags: ['single-agent', 'weather-flow', 'staging'],
    metadata: {
      user_id: 'user_2048',
      session_id: 'session_20260331_01',
    },
  },
);

console.log(result.messages.at(-1)?.text);
