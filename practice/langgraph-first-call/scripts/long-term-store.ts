import {
  END,
  GraphNode,
  InMemoryStore,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
} from '@langchain/langgraph';
import { OpenAIEmbeddings } from '@langchain/openai';

const embeddings = new OpenAIEmbeddings({
  model: 'embedding-3',
  dimensions: 512,
  encodingFormat: 'float',
  apiKey: process.env.API_KEY,
  configuration: {
    baseURL: process.env.BASE_URL,
  },
});

const store = new InMemoryStore({
  index: {
    embeddings,
    dims: 512,
    fields: ['text'],
  },
});
const namespace = ['user', 'user_001', 'profile'];

await store.put(namespace, 'preferences', {
  tone: 'short',
  language: 'zh-CN',
});

await store.put(namespace, 'm2', {
  text: '用户希望邮件语气尽量简短直接',
  kind: 'writing-preference',
});

await store.put(namespace, 'm1', {
  text: '用户偏好周末上午开会',
  kind: 'schedule-preference',
});

const State = new StateSchema({
  messages: MessagesValue,
});

const respondWithMemory: GraphNode<typeof State> = async (state, config) => {
  const userId = config.context?.userId;
  const namespace = ['user', userId ?? 'anonymous', 'profile'];
  const preferencesStore = await config.store?.get?.(namespace, 'preferences');
  const { tone = 'normal', language = 'zh-CN' } = preferencesStore?.value || {};
  const searchResults = await store.search(namespace, {
    query: '会议时间偏好',
    limit: 1,
  });
  const meeting = searchResults.map((item) => item.value.text).join('，');
  const question = state.messages.at(-1)?.text ?? '';

  return {
    messages: [
      {
        role: 'ai',
        content: `我会用 ${language} 回复，并保持 ${tone} 风格。你刚刚的问题是：${question}你的会议偏好是：${meeting}`,
      },
    ],
  };
};

const config = {
  context: {
    userId: 'user_001',
  },
};

const graph = new StateGraph(State)
  .addNode('respondWithMemory', respondWithMemory)
  .addEdge(START, 'respondWithMemory')
  .addEdge('respondWithMemory', END)
  .compile({
    store,
  });

const r1 = await graph.invoke(
  {
    messages: [{ role: 'user', content: '以后回复我尽量简短一点。' }],
  },
  config,
);

console.log(r1.messages.at(-1)?.content);

await store.put(namespace, 'preferences', {
  tone: 'quiet',
  language: 'en-US',
});

const r2 = await graph.invoke(
  {
    messages: [{ role: 'user', content: '查看最新的记忆。' }],
  },
  config,
);

console.log(r2.messages.at(-1)?.content);
