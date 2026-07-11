import {
  ConditionalEdgeRouter,
  END,
  GraphNode,
  MemorySaver,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
} from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { calculate, getCurrentTime, getWeather } from './tools';
import { AIMessage, DynamicStructuredTool } from 'langchain';

const tools = [getWeather, calculate, getCurrentTime];
const toolsByName: Record<string, DynamicStructuredTool> = Object.fromEntries(
  tools.map((tool) => [tool.name, tool]),
);

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
}).bindTools(tools);

const State = new StateSchema({
  messages: MessagesValue,
});

const callModel: GraphNode<typeof State> = async (state, config) => {
  const userId = config?.configurable?.user_id ?? 'anonymous';

  const systemMessage = {
    role: 'system',
    content: `你是用户 ${userId} 的 AI 伴侣。用温暖的方式回复。`,
  };

  const response = await model.invoke([systemMessage, ...state.messages]);

  return {
    messages: [response],
  };
};

const callTools: GraphNode<typeof State> = async (state) => {
  const lastMsg = state.messages.at(-1)! as AIMessage;
  const toolCalls = lastMsg.tool_calls ?? [];

  const results = await Promise.all(
    toolCalls.map(async (tc) => {
      const message = {
        role: 'tool',
        content: '',
        tool_call_id: tc.id,
      };

      try {
        const result = await toolsByName[tc.name].invoke(tc.args);
        message.content = result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        message.content = `工具执行失败: ${errorMsg}`;
      }

      return message;
    }),
  );

  return {
    messages: results,
  };
};

const shouldContinue: ConditionalEdgeRouter<
  typeof State,
  Record<string, any>,
  'callTools'
> = (state) => {
  const lastMsg = state.messages.at(-1)! as AIMessage;
  const toolCalls = lastMsg.tool_calls ?? [];

  if (toolCalls.length) {
    return 'callTools';
  }

  return END;
};

const checkpointer = new MemorySaver();

const graph = new StateGraph(State)
  .addNode('callModel', callModel)
  .addNode('callTools', callTools)
  .addEdge(START, 'callModel')
  .addConditionalEdges('callModel', shouldContinue, ['callTools', END])
  .addEdge('callTools', 'callModel')
  .compile({ checkpointer });

const config = { configurable: { thread_id: 'test-001', user_id: 'user_001' } };

const r1 = await graph.invoke(
  {
    messages: [
      { role: 'user', content: '北京和上海今天天气怎么样？顺便算下 365 * 24' },
    ],
  },
  config,
);
console.log(r1.messages.at(-1)?.content);

const r2 = await graph.invoke(
  { messages: [{ role: 'user', content: '现在几点了？' }] },
  config,
);
console.log(r2.messages.at(-1)?.content);

const r3 = await graph.invoke(
  { messages: [{ role: 'user', content: '前面我问了你什么？' }] },
  config,
);
console.log(r3.messages.at(-1)?.content);

console.log(r3.messages);

// for (const msg of r3.messages) {
//   const type = msg.type;

//   if (type === 'human') {
//     console.log(`[用户] ${msg.content}`);
//   } else if (type === 'ai' && (msg as AIMessage).tool_calls?.length) {
//     console.log(
//       `[模型决策] 调用工具: ${(msg as AIMessage).tool_calls!.map((tc) => `${tc.name}(${JSON.stringify(tc.args)})`).join(', ')}`,
//     );
//   } else if (type === 'tool') {
//     console.log(`[工具结果] ${msg.content}`);
//   } else {
//     console.log(`[模型回复] ${msg.content}`);
//   }
// }
