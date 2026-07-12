import { tool } from 'langchain';
import z from 'zod';

export const getWeather = tool(
  async ({ city }) => {
    const fakeWeatherMap: Record<string, string> = {
      上海: '明天小雨，17-22 度',
      北京: '明天晴，12-25 度',
      深圳: '明天多云，26-30 度',
    };

    return fakeWeatherMap[city] ?? `${city}：暂无天气数据`;
  },
  {
    name: 'get_weather',
    description: '查询某个城市未来的天气情况',
    schema: z.object({
      city: z.string().describe('要查询天气的城市名'),
    }),
  },
);

export const createReminder = tool(
  async ({ content, time }) => {
    return {
      ok: true,
      message: `提醒已创建：${time} - ${content}`,
    };
  },
  {
    name: 'create_reminder',
    description: '帮用户创建一个提醒事项',
    schema: z.object({
      content: z.string().describe('提醒的具体内容'),
      time: z.string().describe('提醒时间，例如 明天早上 8 点'),
    }),
  },
);

export const querySchedule = tool(
  async ({ date }) => {
    const schedules: Record<string, string> = {
      明天: '10:00 产品评审会，14:00 和小李 1v1',
      后天: '全天无日程',
    };

    return schedules[date] ?? `${date}：没有找到日程`;
  },
  {
    name: 'query_schedule',
    description: '查询用户某一天的日程安排',
    schema: z.object({
      date: z.string().describe('要查询的日期，例如 今天、明天、后天'),
    }),
  },
);

export const calculate = tool(
  async ({ expression }) => {
    try {
      const result = new Function(`return ${expression}`)();
      return `${expression} = ${result}`;
    } catch {
      return `无法计算: ${expression}`;
    }
  },
  {
    name: 'calculate',
    description: '计算数学表达式',
    schema: z.object({
      expression: z.string().describe('数学表达式，例如 "2 + 3 * 4"'),
    }),
  },
);

export const getCurrentTime = tool(
  async () => {
    return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  },
  {
    name: 'get_current_time',
    description: '获取当前北京时间',
    schema: z.object({}),
  },
);

export const checkCalendar = tool(
  async ({ date, period }) => {
    return `${date} 的 ${period} 目前空闲，可以安排会议。`;
  },
  {
    name: 'check_calendar',
    description: '查看某一天某个时间段是否空闲',
    schema: z.object({
      date: z.string(),
      period: z.string(),
    }),
  },
);

export const draftEmail = tool(
  async ({ to, subject, body }) => {
    return `邮件草稿已生成：收件人 ${to}，主题《${subject}》，正文：${body}`;
  },
  {
    name: 'draft_email',
    description: '生成邮件草稿',
    schema: z.object({
      to: z.string(),
      subject: z.string(),
      body: z.string(),
    }),
  },
);
