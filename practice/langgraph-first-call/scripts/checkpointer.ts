import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { RunnableConfig } from '@langchain/core/runnables';
import {
  END,
  GraphNode,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
  MemorySaver,
} from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

const State = new StateSchema({
  messages: MessagesValue,
});

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

const systemPrompt = ChatPromptTemplate.fromMessages([
  ['system', '你是一个助手，你会根据用户的问题给出非常简短的回答。'],
  new MessagesPlaceholder('messages'),
]);

const callModel: GraphNode<typeof State> = async (state) => {
  const ms = await systemPrompt.invoke({ messages: state.messages });
  const response = await model.invoke(ms);
  // const response = await systemPrompt.pipe(model).invoke(state.messages);

  return {
    messages: [response],
  };
};

const checkpointer = new MemorySaver();

const graph = new StateGraph(State)
  .addNode('callModel', callModel)
  .addEdge(START, 'callModel')
  .addEdge('callModel', END)
  .compile({
    checkpointer,
  });

const config = {
  configurable: { thread_id: 'chat-001' },
};

const r1 = await graph.invoke(
  { messages: [{ role: 'user', content: '我叫小明，我是前端工程师' }] },
  config,
);
console.log(r1.messages.at(-1)?.content);

const r2 = await graph.invoke(
  { messages: [{ role: 'user', content: '我喜欢吃辣' }] },
  config,
);
console.log(r2.messages.at(-1)?.content);

const r3 = await graph.invoke(
  {
    messages: [
      { role: 'user', content: '我叫什么？我做什么工作？我喜欢吃辣吗？' },
    ],
  },
  config,
);
console.log(r3.messages.at(-1)?.content);

// const r3 = await graph.invoke(
//   { messages: [{ role: 'user', content: '我叫什么？' }] },
//   { configurable: { thread_id: 'chat-002' } },
// );
// console.log(r3.messages.at(-1)?.content);

// console.log('1: ', r2);
// console.log('2: ', r3);
// console.log('checkpointer', checkpointer);

// const snapshot = await graph.getState(config);
// console.log('snapshot: ', snapshot);

// for await (const snapshot of graph.getStateHistory(config)) {
//   console.log('---');
//   console.log(snapshot);
//   console.log('checkpoint_id:', snapshot.config.configurable?.checkpoint_id);
//   console.log('消息数量:', snapshot.values.messages?.length ?? 0);
//   console.log('下一步:', snapshot.next);
// }

// 撤回到第二轮消息
let targetConfig: RunnableConfig | undefined;
for await (const snapshot of graph.getStateHistory(config)) {
  if (snapshot.values.messages?.length === 2) {
    targetConfig = snapshot.config;
  }
}

if (!targetConfig) {
  throw new Error('未找到目标配置');
}

const r4 = await graph.invoke(
  {
    messages: [
      { role: 'user', content: '我叫什么？我做什么工作？我喜欢吃辣吗？' },
    ],
  },
  targetConfig,
);
console.log(r4.messages.at(-1)?.content);
