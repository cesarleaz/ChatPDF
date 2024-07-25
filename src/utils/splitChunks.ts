import { encode } from 'gpt-3-encoder';
import type { TextItem } from 'unpdf/dist/types/src/display/api'

export function generateNewChunkList(chunkList: { sentence: string; pageNum: number }[]) {
  const combined = [];
  let currentString = '';
  let currentPageNum = 1;

  for (let i = 0; i < chunkList.length; i++) {
    if (
      currentPageNum !== chunkList[i].pageNum ||
      encode(currentString).length + encode(chunkList[i].sentence).length > 300
    ) {
      combined.push({
        content_length: currentString.trim().length,
        content: currentString.trim(),
        content_tokens: encode(currentString.trim()).length,
        page_num: currentPageNum
      });
      currentString = '';
    }

    currentString += chunkList[i].sentence;
    currentPageNum = chunkList[i].pageNum;
  }

  combined.push({
    content_length: currentString.trim().length,
    content: currentString.trim(),
    content_tokens: encode(currentString.trim()).length,
    page_num: currentPageNum
  });

  return combined;
}

export async function generateSentenceList(doc: any) {
  const { numPages } = doc
  const sentenceEndSymbol = /[。.]\s+/
  const allSentenceList = []

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const currentPage = await doc.getPage(pageNum)
    const currentPageContent = await currentPage.getTextContent()
    const currentPageText = currentPageContent.items
      .map((item: TextItem) => item.str)
      .join(' ')

    const sentenceList = currentPageText.split(sentenceEndSymbol)
    allSentenceList.push(
      ...sentenceList.map((item: string) => ({ sentence: item, pageNum }))
    )
  }

  return allSentenceList.filter((item) => item.sentence)
}
