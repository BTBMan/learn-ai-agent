import { OpenAIEmbeddings } from '@langchain/openai';

const embeddings = new OpenAIEmbeddings({
  model: 'embedding-3',
  apiKey: process.env.API_KEY,
  configuration: {
    baseURL: process.env.BASE_URL,
  },
});

// 这里是知识库里的文档内容，属于“提前建索引”的阶段。
const docVectors = await embeddings.embedDocuments([
  '员工提交请假申请后，需要主管审批。',
  '报销流程需要上传票据和审批单。',
]);

// 这里是用户实时发来的问题，属于“查询阶段”。
const queryVector = await embeddings.embedQuery('请假要先找谁审批');

// 两条文档，所以会返回两组向量。
console.log(docVectors.length);
// 查询只有一句，所以只会得到一组向量。
console.log(queryVector.length);
