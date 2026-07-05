import { MemorySaver } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { createAgent, summarizationMiddleware } from 'langchain';

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

// 是用 checkpointer 来保存短期记忆
const checkpointer = new MemorySaver();

const agent = createAgent({
  model,
  tools: [],
  middleware: [
    summarizationMiddleware({
      model,
      trigger: { tokens: 4000 },
      keep: { messages: 20 },
    }),
  ],
  checkpointer,
  systemPrompt: '你是一个善于倾听的 AI 伴侣。',
});

const config = {
  configurable: {
    thread_id: 'companion-user-001',
  },
};

const result1 = await agent.invoke(
  {
    messages: [{ role: 'user', content: '我今天加班到快 11 点' }],
  },
  config,
);

// console.log(checkpointer.storage);

console.log(result1.messages.at(-1)?.content);

const result2 = await agent.invoke(
  {
    messages: [{ role: 'user', content: '还是上次那个需求，改了好几版了' }],
  },
  config,
);

// console.log(checkpointer.storage);

console.log(result2.messages.at(-1)?.content);

const result3 = await agent.invoke(
  {
    messages: [{ role: 'user', content: '你还记得我刚才在烦什么吗？' }],
  },
  config,
);

// console.log(checkpointer.storage);

console.log(result3.messages.at(-1)?.content);
