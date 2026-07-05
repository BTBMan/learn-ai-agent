import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableBranch, RunnablePassthrough } from '@langchain/core/runnables';
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

// 创建一个分类 chain
const classifyChain = ChatPromptTemplate.fromMessages([
  [
    'system',
    [
      '判断用户消息意图，只输出以下三个类别之一：',
      '- tech',
      '- emotional',
      '- casual',
    ].join('\n'),
  ],
  ['human', '{input}'],
])
  .pipe(model)
  .pipe(new StringOutputParser());

// 不同类别的场景
const techPreFilter = RunnablePassthrough.assign({
  scene: () => 'tech',
});

const emotionalPreFilter = RunnablePassthrough.assign({
  scene: () => 'emotional',
});

const casualPreFilter = RunnablePassthrough.assign({
  scene: () => 'casual',
});

// 创建一个路由
const routeByIntent = RunnableBranch.from([
  [({ intent }: { intent: string }) => intent.trim() === 'tech', techPreFilter],
  [
    ({ intent }: { intent: string }) => intent.trim() === 'emotional',
    emotionalPreFilter,
  ],
  casualPreFilter,
]);

// 创建一个预处理
const preprocess = await RunnablePassthrough.assign({
  intent: classifyChain,
})
  .pipe(routeByIntent)
  .invoke({ input: '这个 React 页面怎么老实多次触发?' });
// .invoke({ input: '今天开会被否了三次，心里有点堵。' });

const prompt = ChatPromptTemplate.fromMessages<{
  scene: string;
  intent: string;
  input: string;
}>([
  ['human', [`scene={scene}`, `intent={intent}`, `input={input}`].join('\n')],
]);

const messages = await prompt.formatMessages({
  scene: preprocess.scene,
  intent: preprocess.intent,
  input: preprocess.input,
});

console.log(messages);

const agent = createAgent({
  model,
  tools: [],
  systemPrompt: [
    '你是一个前端陪伴助手。',
    'scene=tech 时，优先回答技术问题。',
    'scene=emotional 时，先共情，再给一个小建议。',
    'scene=casual 时，就正常闲聊。',
  ].join('\n'),
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
