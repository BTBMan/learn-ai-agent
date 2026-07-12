import {
  StateGraph,
  StateSchema,
  ReducedValue,
  START,
  END,
  Command,
} from '@langchain/langgraph';
import type { GraphNode, ConditionalEdgeRouter } from '@langchain/langgraph';
import { z } from 'zod';

const appendMessages = (
  current: Array<{ role: 'user' | 'assistant'; content: string }>,
  update: Array<{ role: 'user' | 'assistant'; content: string }>,
) => {
  return [...current, ...update];
};

const State = new StateSchema({
  activeAgent: z.enum(['general', 'travel']).default('general'),
  messages: new ReducedValue(
    z
      .array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        }),
      )
      .default([]),
    { reducer: appendMessages },
  ),
});

const generalAgent: GraphNode<typeof State> = (state) => {
  const lastMessage = state.messages.at(-1)?.content ?? '';

  // 如果用户已经明确在聊旅行，这里就不继续硬接了
  if (
    lastMessage.includes('旅行') ||
    lastMessage.includes('机票') ||
    lastMessage.includes('酒店')
  ) {
    return new Command({
      update: {
        activeAgent: 'travel',
        messages: [
          {
            role: 'assistant',
            content: '接下来由旅行助理继续帮你安排行程。',
          },
        ],
      },
      goto: 'travelAgent',
    });
  }

  return {
    messages: [
      {
        role: 'assistant',
        content:
          '我先帮你判断一下需求方向，如果是旅行规划，我会把对话切给旅行助理。',
      },
    ],
  };
};

const travelAgent: GraphNode<typeof State> = (state) => {
  const lastMessage = state.messages.at(-1)?.content ?? '';

  // 这里假设控制权已经切到了旅行角色，
  // 所以后面的回复会直接站在旅行助理的视角继续往下接
  return {
    messages: [
      {
        role: 'assistant',
        content: `旅行助理已接手，当前收到的新要求是：${lastMessage}`,
      },
    ],
  };
};

const shouldContinue: ConditionalEdgeRouter<typeof State> = (state) => {
  if (state.activeAgent === 'travel') return 'travelAgent';
  return END;
};

const graph = new StateGraph(State)
  .addNode('generalAgent', generalAgent, { ends: ['travelAgent'] })
  .addNode('travelAgent', travelAgent)
  .addEdge(START, 'generalAgent')
  .addConditionalEdges('generalAgent', shouldContinue, ['travelAgent'])
  .addEdge('travelAgent', END)
  .compile();

let state = await graph.invoke({
  messages: [{ role: 'user', content: '我想做一个日本旅行规划。' }],
});

console.log(state);

state = await graph.invoke({
  activeAgent: state.activeAgent,
  messages: [{ role: 'user', content: '预算尽量控制在五千以内。' }],
});

console.log(state);
// console.log(state.messages.at(-1)?.content);
