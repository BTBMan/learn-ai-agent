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

const State = new StateSchema({
  messages: MessagesValue,
  report: z.string().default(''),
  quality: z.enum(['unchecked', 'pass', 'fail']).default('unchecked'),
  reviewFeedback: z.string().default(''),
  reviewCount: z.number().default(0),
});

const gather: GraphNode<typeof State> = (state) => {
  const question = state.messages.at(-1)?.content?.toString() ?? '';

  return {
    messages: [
      { role: 'assistant', content: `已收集「${question}」的相关信息。` },
    ],
  };
};

const analyze: GraphNode<typeof State> = (state) => {
  if (state.reviewCount === 0) {
    return {
      report: '初步分析：数据呈上升趋势。',
    };
  }

  return {
    report: `深度分析（第 ${state.reviewCount + 1} 版）：数据呈上升趋势，主要驱动因素是用户增长（+15%）和客单价提升（+8%）。环比增速放缓，需关注获客成本变化。`,
  };
};

const review: GraphNode<typeof State> = (state) => {
  const count = state.reviewCount + 1;

  if (state.report.includes('%') && state.report.length > 50) {
    return {
      quality: 'pass',
      reviewFeedback: '',
      reviewCount: count,
    };
  }

  return {
    quality: 'fail',
    reviewFeedback: '报告缺少具体数据支撑，请补充百分比、绝对值等量化指标',
    reviewCount: count,
  };
};

const output: GraphNode<typeof State> = (state) => {
  return {
    messages: [
      {
        role: 'assistant',
        content: `分析完成（经过 ${state.reviewCount} 轮审核）：\n\n${state.report}`,
      },
    ],
  };
};

const reviewRouter: ConditionalEdgeRouter<
  typeof State,
  Record<string, any>,
  'analyze' | 'output'
> = (state) => {
  if (state.quality === 'pass') {
    return 'output';
  }

  if (state.reviewCount >= 3) {
    return 'output';
  }

  return 'analyze';
};

const graph = new StateGraph(State)
  .addNode('gather', gather)
  .addNode('analyze', analyze)
  .addNode('review', review)
  .addNode('output', output)
  .addEdge(START, 'gather')
  .addEdge('gather', 'analyze')
  .addEdge('analyze', 'review')
  .addConditionalEdges('review', reviewRouter, ['output', 'analyze'])
  .addEdge('output', END)
  .compile();

const result = await graph.invoke({
  messages: [{ role: 'user', content: '分析上季度的营收趋势' }],
});

console.log(result.messages.at(-1)?.content);
