import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableLambda, RunnablePassthrough } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';

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

const agent = createAgent({
  model,
  tools: [],
  systemPrompt: [
    '你是一个前端陪伴助手。',
    '如果 priority=high，先帮用户稳住情绪，再给一个动作建议。',
    '如果 priority=normal，就正常交流，不要过度放大情绪。',
  ].join('\n'),
});

// RunnablePassthrough: 保留原始的字段, 添加新的字段
const enrichInput = RunnablePassthrough.assign({
  trimmedInput: ({ input }: { input: string }) => input.trim(),
  inputLength: ({ input }: { input: string }) => input.trim().length,
});

// RunnableLambda: 适合放一小段逻辑, 直接返回函数返回的内容
const detectPriority = RunnableLambda.from(
  ({ trimmedInput }: { trimmedInput: string }) => {
    const urgentWords = ['线上', '故障', '崩溃', '来不及'];
    const isUrgent = urgentWords.some((word) => trimmedInput.includes(word));

    return {
      trimmedInput,
      priority: isUrgent ? 'high' : 'normal',
    };
  },
);

const preprocess = await enrichInput.pipe(detectPriority).invoke({
  input: '  线上刚出故障，今晚估计又得加班。  ',
});

const prompt = ChatPromptTemplate.fromMessages<{
  priority: string;
  trimmedInput: string;
}>([['human', [`priority={priority}`, `input={trimmedInput}`].join('\n')]]);

const messages = await prompt.formatMessages({
  priority: preprocess.priority,
  trimmedInput: preprocess.trimmedInput,
});

const stream = await agent.stream(
  {
    messages: messages,
  },
  {
    streamMode: 'messages',
  },
);

process.stdout.write('invoke result:\n');

for await (const [messageChunk] of stream) {
  if (messageChunk.content) {
    process.stdout.write(messageChunk.text);
  }
}

process.stdout.write('\n');
