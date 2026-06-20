import {
  ChatPromptTemplate,
  FewShotChatMessagePromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
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
  systemPrompt:
    '你是一名面向前端开发者的陪伴助手。先共情，再给建议，控制在 3 句话以内。',
});

const examples = [
  {
    input: '今天开会被否了 3 次，我有点怀疑自己。',
    output:
      '被连续否定确实很伤状态，但这不等于你能力不行。先把被否的点拆成“需求变化”和“表达问题”两类，你会更容易看清哪里该改。今晚先别继续内耗，把问题归档下来就够了。',
  },
  {
    input: '我明知道要学 React 19，可一下班就只想躺着刷手机。',
    output:
      '你不是不想学，你只是下班后已经没有整块意志力了。今晚别定大目标，只看 15 分钟一个小点。先把启动门槛降下来，反而更容易重新进入状态。',
  },
];

const examplePrompt = ChatPromptTemplate.fromMessages([
  ['human', '{input}'],
  ['ai', '{output}'],
]);

const fewShotPrompt = new FewShotChatMessagePromptTemplate({
  examples,
  examplePrompt,
  inputVariables: [],
});

const prompt = ChatPromptTemplate.fromMessages([
  ...(await fewShotPrompt.formatMessages({})),
  ['human', '{input}'],
]);

const promptValue = await prompt.invoke({
  input: '今天被改了好多次需求，我现在真的有点烦。',
});

const stream = await agent.stream(
  {
    messages: promptValue.toChatMessages(),
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
