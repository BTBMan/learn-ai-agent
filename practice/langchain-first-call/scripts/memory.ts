import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';

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

const prompt = ChatPromptTemplate.fromMessages([
  ['system', '你是一个善于倾听的 AI 伴侣。'],
  new MessagesPlaceholder({
    variableName: 'history',
  }),
  ['human', '{input}'],
]);

const chain = prompt.pipe(model);

// 模拟对话历史
const store = new Map<string, InMemoryChatMessageHistory>();

// 存取历史
const getMessageHistory = (sessionId: string) => {
  if (!store.has(sessionId)) {
    store.set(sessionId, new InMemoryChatMessageHistory());
  }

  return store.get(sessionId)!;
};

// 用 RunnableWithMessageHistory 来包装 chain
const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory,
  inputMessagesKey: 'input',
  historyMessagesKey: 'history',
});

const config = {
  configurable: {
    sessionId: 'user-001',
  },
};

const result1 = await chainWithHistory.invoke(
  {
    input: '我今天加班到很晚',
  },
  config,
);

console.log(store.get(config.configurable.sessionId));

console.log(result1.content);

const result2 = await chainWithHistory.invoke(
  {
    input: '快 11 点了，还是因为上次那个需求',
  },
  config,
);

console.log(store.get(config.configurable.sessionId));

console.log(result2.content);
