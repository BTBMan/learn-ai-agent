import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';
import z from 'zod';

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

const emotionSchema = z.object({
  emotion: z.enum(['calm', 'anxious', 'sad', 'angry']),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1),
});

// const structuredModel = model.withStructuredOutput(emotionSchema); // <---- 可以用模型结构化输出

const agent = createAgent({
  model,
  tools: [],
  systemPrompt: '判断用户情绪，并给出简短摘要。',
  responseFormat: emotionSchema, // <---- 也可以用 agent 结构化输出
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

console.log(stream);

process.stdout.write('invoke result:\n');

for await (const [messageChunk] of stream) {
  if (messageChunk.content) {
    process.stdout.write(messageChunk.text);
  }
}

process.stdout.write('\n');
