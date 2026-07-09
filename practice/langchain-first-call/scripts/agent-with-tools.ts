import { ChatOpenAI } from '@langchain/openai';
import { createReminder, getWeather } from './tools';
import { createAgent, DynamicStructuredTool, HumanMessage } from 'langchain';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { TraceCallbackHandler } from './trace-handler';

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
  tools: [getWeather, createReminder],
  systemPrompt: '你是用户的生活助理，能聊天，也能在必要时调用工具。',
});

const handler = new TraceCallbackHandler();

const result = await agent.stream(
  {
    messages: [
      {
        role: 'user',
        // content: '帮我看看明天上海天气，如果下雨就提醒我带伞。',
        content:
          '帮我看看明天上海天气。如果下雨就提醒我带伞，再把结果顺手发给我。',
      },
    ],
  },
  {
    streamMode: ['messages', 'tools'],
    // streamMode: 'messages',
    callbacks: [handler],
  },
);

// console.log(result.messages.at(-1)?.text);

process.stdout.write('invoke result:\n');

for await (const [type, messageChunk] of result) {
  if (type === 'tools') {
    process.stdout.write(
      `\n工具调用:\nID: ${messageChunk.toolCallId}\n名称: ${messageChunk.name}\n事件: ${messageChunk.event}\n\n`,
    );
  } else if (type === 'messages') {
    messageChunk.forEach((message) => {
      if (message.content) {
        process.stdout.write(message.text);
      }
    });
  }
}

process.stdout.write('\n');

const trace = handler.toJSON();

console.log(`共 ${trace.spanCount} 个 Span：`);

trace.spans.forEach((span) => {
  console.log(`  [${span.status}] ${span.name} - ${span.duration}ms`);
});
