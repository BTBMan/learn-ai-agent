import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { docChunks } from './loader-and-splitter';
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
});

const embeddings = new OpenAIEmbeddings({
  model: 'embedding-3',
  apiKey: process.env.API_KEY,
  configuration: {
    baseURL: process.env.BASE_URL,
  },
});

const vectorStore = await MemoryVectorStore.fromDocuments(
  docChunks,
  embeddings,
);

async function answerWithKnowledge(question: string) {
  const docs = await vectorStore.similaritySearch(question, 9);

  // docs.forEach((doc) => {
  //   // pageContent 是真正检索命中的正文。
  //   console.log(doc.pageContent);
  //   // metadata 方便你确认它是从哪份资料、哪个主题里取回来的。
  //   console.log(doc.metadata);
  // });

  const context = docs
    .map((doc, index) => {
      return `资料 ${index + 1}：${doc.pageContent}`;
    })
    .join('\n\n');

  const result = await agent.invoke({
    messages: [
      {
        role: 'system',
        content: `你是我的私人 AI 助手。

请优先根据下面的参考资料回答问题。
如果资料里没有明确答案，就直接说不知道，不要编造。

参考资料：
${context}`,
      },
      {
        role: 'user',
        content: question,
      },
    ],
  });

  return result.messages.at(-1)?.text ?? '';
}

const answer = await answerWithKnowledge(
  // '用到 LangChain 和 LangGraph 的项目有哪些？',
  '帮忙总结 "小白 AI 伴侣 - XIAOBAI" 这个项目',
);

console.log(answer);
