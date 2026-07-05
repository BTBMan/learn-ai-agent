import { JsonOutputParser } from '@langchain/core/output_parsers';
import { MemorySaver } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { createAgent, summarizationMiddleware } from 'langchain';

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

const parser = new JsonOutputParser();

const extractLongTermMemory = async (conversationText: string) => {
  const prompt = `请从下面这段对话里提取长期记忆。

返回 JSON，包含：
- facts: 用户事实
- events: 重要事件
- preferences: 用户偏好
- emotionSnapshot: 情绪概括

对话内容：
${conversationText}`;

  const response = await model.invoke(prompt);

  return parser.invoke(response);
};

const ret = await extractLongTermMemory(`
用户：我今天又在准备字节的二面，还是有点焦虑。
助手：你更担心面试本身，还是等结果这段时间？
用户：主要是等结果，而且我还是不喜欢别人一直给我灌鸡汤。
  `);

console.log(ret);
