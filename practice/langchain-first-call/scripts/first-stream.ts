import { ChatOpenAI } from '@langchain/openai';

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

const stream = await model.stream([
  {
    role: 'system',
    content: '你是一名面向前端开发者的助手，回答要清楚、简短。',
  },
  {
    role: 'user',
    content: '请用两句话确认 LangChain 与 DeepSeek 的连接已经正常。',
  },
]);

process.stdout.write('invoke result:\n');

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}

process.stdout.write('\n');
