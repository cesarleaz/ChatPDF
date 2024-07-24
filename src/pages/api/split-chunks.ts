import type { APIRoute } from 'astro';
import { encode } from 'gpt-3-encoder';

function generateNewChunkList(chunkList: { sentence: string; pageNum: number }[]) {
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const { sentenceList } = (await request.formData()) as any;
    const chunkList = generateNewChunkList(sentenceList);

    return new Response(JSON.stringify({ chunkList }))
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'erro '}), { status: 500 })
  }
};
