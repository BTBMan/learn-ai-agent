import { ChatOpenAI } from '@langchain/openai';
import { createReminder, getWeather } from './tools';
import { DynamicStructuredTool, HumanMessage } from 'langchain';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';

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

const tools = [getWeather, createReminder];
const toolMap = new Map<string, DynamicStructuredTool>(
  tools.map((tool) => [tool.name, tool]),
);

const modelWithTools = model.bindTools(tools);

const messages: BaseLanguageModelInput = [
  new HumanMessage('帮我看看明天上海天气，如果下雨就提醒我带伞。'),
];

const aiMessage = await modelWithTools.invoke(messages);

messages.push(aiMessage);

for (const toolCall of aiMessage.tool_calls || []) {
  const selectedTool = toolMap.get(toolCall.name);

  if (!selectedTool) {
    throw new Error(`未知工具：${toolCall.name}`);
  }

  const toolMessage = await selectedTool.invoke(toolCall);

  messages.push(toolMessage);
}

const result = await modelWithTools.invoke(messages);

console.log(messages);

console.log(result.text);

console.log(result);
