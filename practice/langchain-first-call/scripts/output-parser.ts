import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { SystemMessage } from '@langchain/core/messages';
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

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  emotion: '用户当前最主要的情绪',
  confidence: '用户当前的自信',
  summary: '判断该情绪的简短原因',
});

const agent = createAgent({
  model,
  tools: [],
  systemPrompt: new SystemMessage(
    [
      '你负责做情绪识别。',
      '只返回 JSON，不要补充解释。',
      parser.getFormatInstructions(),
    ].join('\n'),
  ).text,
});

const prompt = ChatPromptTemplate.fromMessages([['human', '{input}']]);

const messages = await prompt.formatMessages({
  input: '今天一直在改 bug，越改越乱，我有点烦。',
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
