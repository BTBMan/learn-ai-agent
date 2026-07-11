import {
  Command,
  END,
  GraphNode,
  interrupt,
  MemorySaver,
  START,
  StateGraph,
  StateSchema,
} from '@langchain/langgraph';
import z from 'zod';

const State = new StateSchema({
  topic: z.string().default(''),
  draft: z.string().default(''),
  feedback: z.string().default(''),
  status: z.string().default('pending'),
  version: z.number().default(0),
});

const generate: GraphNode<typeof State> = (state) => {
  const version = state.version + 1;

  if (version === 1) {
    return {
      draft: `【${state.topic}】LangGraph 是一个基于图结构的 AI 工作流编排框架，让你用节点和边来组织复杂的 Agent 逻辑。`,
      version,
    };
  }

  return {
    draft: `【${state.topic}】LangGraph 是一个基于图结构的 AI 工作流编排框架。它的核心优势在于：状态管理清晰、控制流显式、支持人工介入。（根据反馈修改：${state.feedback}）`,
    version,
  };
};

const review: GraphNode<typeof State> = (state) => {
  const decision = interrupt<
    {
      message: string;
      draft: string;
      version: number;
      instructions: string;
    },
    { approved: boolean; feedback?: string }
  >({
    message: '请审核以下文案',
    draft: state.draft,
    version: state.version,
    instructions:
      '回复 { approved: true } 通过，或 { approved: false, feedback: "修改建议" } 打回',
  });

  if (decision.approved) {
    return new Command({
      update: {
        status: 'approved',
        feedback: '',
      },
      goto: 'publish',
    });
  }

  return new Command({
    update: {
      status: 'rejected',
      feedback: decision.feedback ?? '请改进',
    },
    goto: 'generate',
  });
};

const publish: GraphNode<typeof State> = (state) => {
  return {
    status: 'published',
    draft: `[已发布] ${state.draft}`,
  };
};

const checkpointer = new MemorySaver();

const graph = new StateGraph(State)
  .addNode('generate', generate)
  .addNode('publish', publish)
  .addNode('review', review, { ends: ['generate', 'publish'] })
  .addEdge(START, 'generate')
  .addEdge('generate', 'review')
  .addEdge('publish', END)
  .compile({ checkpointer });

const config = { configurable: { thread_id: 'review-001' } };

// 1.
await graph.invoke({ topic: 'LangGraph 简介' }, config);

let snapshot = await graph.getState(config);
const interruptInfo = snapshot.tasks[0]?.interrupts[0]?.value;

console.log(interruptInfo);

// 2.
await graph.invoke(
  new Command({
    resume: {
      approved: false,
      feedback: '请补充核心优势',
    },
  }),
  config,
);

snapshot = await graph.getState(config);
console.log(snapshot.tasks[0]?.interrupts[0]?.value);

// 3
const result = await graph.invoke(
  new Command({ resume: { approved: true } }),
  config,
);

console.log(result.status);
console.log(result.version);
