import {
  END,
  GraphNode,
  ReducedValue,
  START,
  StateGraph,
  StateSchema,
} from '@langchain/langgraph';
import z from 'zod';

const State = new StateSchema({
  topic: z.string().default(''),
  plan: z.string().default(''),
  results: new ReducedValue(
    z
      .array(
        z.object({
          role: z.string(),
          content: z.string(),
        }),
      )
      .default([]),
    {
      reducer(current, update) {
        return [...current, ...update];
      },
    },
  ),
  finalAnswer: z.string().default(''),
});

const leadAgent: GraphNode<typeof State> = (state) => {
  return {
    plan: `围绕「${state.topic}」拆成两部分：行业信息和风险判断并行推进。`,
  };
};

const researchAgent: GraphNode<typeof State> = (state) => {
  return {
    results: [
      {
        role: 'research',
        content: `研究员反馈：${state.topic} 目前的核心竞品主要集中在浏览器入口和 Agent 能力整合。`,
      },
    ],
  };
};

const riskAgent: GraphNode<typeof State> = (state) => {
  return {
    results: [
      {
        role: 'risk',
        content: `风险分析：${state.topic} 可能面临隐私合规、模型成本和浏览器兼容性问题。`,
      },
    ],
  };
};

const summarize: GraphNode<typeof State> = (state) => {
  // 这里拿到的 state.results，已经是前面两个并行节点都写回后的合并结果
  return {
    finalAnswer: state.results.map((item) => item.content).join('\n'),
  };
};

const graph = new StateGraph(State)
  .addNode('leadAgent', leadAgent)
  .addNode('researchAgent', researchAgent)
  .addNode('riskAgent', riskAgent)
  .addNode('summarize', summarize)
  .addEdge(START, 'leadAgent')
  .addEdge('leadAgent', 'researchAgent')
  .addEdge('leadAgent', 'riskAgent')
  .addEdge('riskAgent', 'summarize')
  .addEdge('researchAgent', 'summarize')
  .addEdge('summarize', END)
  .compile();

const result = await graph.invoke({
  topic: 'AI 浏览器',
});

console.log(result);
