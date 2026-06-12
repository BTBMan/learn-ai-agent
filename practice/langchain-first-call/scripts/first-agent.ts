import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';

const model = new ChatOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
  configuration: {
    baseURL: process.env.DEEPSEEK_BASE_URL,
  },
  modelKwargs: {
    thinking: {
      type: 'disabled',
    },
  },
});

const agent = createAgent({
  model,
  tools: [],
  systemPrompt: '你是一名面向前端开发者的助手，回答要自然、简短。',
});

const stream = await agent.stream(
  {
    messages: [
      {
        role: 'user',
        content: '请用两句话确认 LangChain 与 DeepSeek 的连接已经正常。',
      },
    ],
  },
  {
    streamMode: 'messages',
  },
);

process.stdout.write('invoke result:\n');

for await (const [messageChunk] of stream) {
  if (messageChunk.content) {
    process.stdout.write(messageChunk.text);
  }
}

process.stdout.write('\n');
