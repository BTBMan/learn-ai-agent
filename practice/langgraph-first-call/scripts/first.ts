import {
  ConditionalEdgeRouter,
  END,
  GraphNode,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
} from '@langchain/langgraph';
import z from 'zod';

const MOODS = ['happy', 'sad', 'neutral'] as const;

const State = new StateSchema({
  messages: MessagesValue,
  mood: z.enum(MOODS).default('neutral'),
});

// 情绪分析节点
const analyzeMood: GraphNode<typeof State> = (state) => {
  const lastMsg = state.messages.at(-1)?.content?.toString() ?? '';
  let mood: (typeof MOODS)[number] = 'neutral';

  if (lastMsg.includes('开心') || lastMsg.includes('高兴')) mood = 'happy';
  if (lastMsg.includes('难过') || lastMsg.includes('伤心')) mood = 'sad';

  return { mood };
};

// 不同情绪对应的节点
const happyReply: GraphNode<typeof State> = () => {
  return {
    messages: [
      { role: 'ai', content: '很高兴听到你这么开心！继续保持好心情 😊' },
    ],
  };
};

const sadReply: GraphNode<typeof State> = () => ({
  messages: [{ role: 'assistant', content: '别难过，有什么我能帮你的吗？' }],
});

const neutralReply: GraphNode<typeof State> = () => ({
  messages: [{ role: 'assistant', content: '你好，有什么可以帮你的？' }],
});

// 路由函数
const moodRouter: ConditionalEdgeRouter<
  typeof State,
  Record<string, any>,
  'happyReply' | 'sadReply' | 'neutralReplay'
> = (state) => {
  switch (state.mood) {
    case 'happy':
      return 'happyReply';
    case 'sad':
      return 'sadReply';
    default:
      return 'neutralReplay';
  }
};

// 连接节点形成图
const graph = new StateGraph(State)
  .addNode('analyzeMood', analyzeMood)
  .addNode('happyReply', happyReply)
  .addNode('sadReply', sadReply)
  .addNode('neutralReply', neutralReply)
  .addEdge(START, 'analyzeMood')
  .addConditionalEdges('analyzeMood', moodRouter, [
    'happyReply',
    'sadReply',
    'neutralReply',
  ])
  .addEdge('happyReply', END)
  .addEdge('sadReply', END)
  .addEdge('neutralReply', END)
  .compile();

const result = await graph.invoke({
  messages: [{ role: 'human', content: '今天好开心啊' }],
});

console.log(result);

console.log(result.mood);

console.log(result.messages.at(-1)?.content);
