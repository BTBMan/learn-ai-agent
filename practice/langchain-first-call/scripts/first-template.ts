import { ChatPromptTemplate } from '@langchain/core/prompts';
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
  systemPrompt: '你是一名温和、克制、说话自然的陪伴助手。',
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    'human',
    ['用户昵称：{nickname}', '当前场景：{scene}', '本轮输入：{input}'].join(
      '\n',
    ),
  ],
]);

const messages = await prompt.formatMessages({
  nickname: '小林',
  scene: '下班后情绪低落，想找人聊一会儿',
  input: '今天真的有点烦，不太想继续改需求了。',
});

const stream = await agent.stream(
  {
    messages,
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
