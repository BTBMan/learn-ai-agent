import { readFileSync } from 'node:fs';
import { Document } from '@langchain/core/documents';
import { PDFParse } from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

async function loadPdfPages(filePath: string): Promise<Document[]> {
  const parser = new PDFParse({
    data: new Uint8Array(readFileSync(filePath)),
  });

  try {
    const { pages } = await parser.getText();
    return pages.map(
      (page) =>
        new Document({
          pageContent: page.text,
          metadata: { source: filePath, page: page.num - 1 },
        }),
    );
  } finally {
    await parser.destroy();
  }
}

const rawDocs = await loadPdfPages(
  new URL('../../../tmp/resume.pdf', import.meta.url).pathname,
);

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 400,
  chunkOverlap: 120,
});

const chunks = await splitter.splitDocuments(rawDocs);

console.log(chunks[0], chunks[1]);
