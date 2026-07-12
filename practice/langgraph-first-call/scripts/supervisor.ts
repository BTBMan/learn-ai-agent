import { ChatOpenAI } from '@langchain/openai';
import { createAgent, tool } from 'langchain';
import { checkCalendar, draftEmail } from './tools';
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

const calendarAgent = createAgent({
  model,
  tools: [checkCalendar],
  systemPrompt: '你是一个日程助理，只处理时间、会议和安排相关的问题。',
});

const emailAgent = createAgent({
  model,
  tools: [draftEmail],
  systemPrompt: '你是一个邮件助理，只处理邮件起草和发送相关的问题。',
});

const askCalendarTool = tool(
  async ({ request }) => {
    const result = await calendarAgent.invoke({
      messages: [{ role: 'human', content: request }],
    });

    return result.messages.at(-1)?.text ?? '';
  },
  {
    name: 'ask_calendar_tool',
    description: '把与日程、会议安排有关的事情交给日程助理处理',
    schema: z.object({
      request: z.string(),
    }),
  },
);

const askEmailAgent = tool(
  async ({ request }) => {
    const result = await emailAgent.invoke({
      messages: [{ role: 'human', content: request }],
    });

    return result.messages.at(-1)?.text ?? '';
  },
  {
    name: 'ask_calendar_tool',
    description: '把与邮件起草、修改、发送有关的事情交给邮件助理处理',
    schema: z.object({
      request: z.string(),
    }),
  },
);

const supervisor = createAgent({
  model,
  tools: [askCalendarTool, askEmailAgent],
  systemPrompt: `
你是一个总控助理。
你的工作不是自己完成所有任务，而是判断当前请求应该交给哪个专门助理。
如果请求里同时包含多个任务，可以按顺序调用多个助理，再把结果整理给用户。
  `.trim(),
});

const result = await supervisor.invoke({
  messages: [
    {
      role: 'user',
      content:
        '帮我看看这周五下午有没有空，再起草一封邮件给客户，说会议改到三点。',
    },
  ],
});

console.log(result.messages.at(-1)?.text);
