import {
  END,
  GraphNode,
  START,
  StateGraph,
  StateSchema,
} from '@langchain/langgraph';
import z from 'zod';

const State = new StateSchema({
  topic: z.string().default(''),
  draft: z.string().default(''),
  tonePassed: z.boolean().default(false),
  riskPassed: z.boolean().default(false),
  published: z.boolean().default(false),
});

const generateDraft: GraphNode<typeof State> = (state) => {
  return {
    draft: `【${state.topic}】LangGraph 很适合需要状态管理和人工介入的工作流。`,
  };
};

const checkTone: GraphNode<typeof State> = (state) => {
  return {
    tonePassed: state.draft.length > 0,
  };
};

const checkRisk: GraphNode<typeof State> = (state) => {
  return {
    riskPassed: state.tonePassed,
  };
};

const publish: GraphNode<typeof State> = () => {
  return {
    published: true,
  };
};

const reviewSubgraph = new StateGraph(State)
  .addNode('checkTone', checkTone)
  .addNode('checkRisk', checkRisk)
  .addEdge(START, 'checkTone')
  .addEdge('checkTone', 'checkRisk')
  .addEdge('checkRisk', END)
  .compile();

const graph = new StateGraph(State)
  .addNode('generateDraft', generateDraft)
  .addNode('reviewSubgraph', reviewSubgraph)
  .addNode('publish', publish)
  .addEdge(START, 'generateDraft')
  .addEdge('generateDraft', 'reviewSubgraph')
  .addEdge('reviewSubgraph', 'publish')
  .addEdge('publish', END)
  .compile();

const result = await graph.invoke({ topic: 'LangGraph 子图入门' });

console.log(result);
