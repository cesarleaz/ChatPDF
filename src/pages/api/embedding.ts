import { Configuration, OpenAIApi } from 'openai';
import { supabaseClient } from '@/utils/supabaseClient';
import getOpenAIBaseUrl from '../../utils/getOpenAIBaseUrl';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { sentenceList } = (await request.formData()) as any;

    const configuration = new Configuration({
      apiKey: import.meta.env.OPENAI_API_KEY,
      basePath: `${getOpenAIBaseUrl()}/v1`  || undefined
    });
    const openai = new OpenAIApi(configuration);

    for (let i = 0; i < sentenceList.length; i++) {
      const chunk = sentenceList[i];
      const { content, content_length, content_tokens, page_num } = chunk;

      if (content.length < 1 || content_length < 1) continue
      
      const embeddingResponse = await openai.createEmbedding({
        model: 'togethercomputer/m2-bert-80M-32k-retrieval',
        input: content
      });

      const [{ embedding }] = embeddingResponse.data.data;

      const { error } = await supabaseClient
        .from('chatgpt')
        .insert({
          content,
          content_length,
          content_tokens,
          page_num,
          embedding
        })
        .select('*');

      if (error) {
        console.log('error', error);
      } else {
        console.log('saved', i);
      }

      // 防止触发openai的每分钟限制
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    return new Response(JSON.stringify('ok'))
  } catch (error) {
    console.error(JSON.stringify(error));
    return new Response(JSON.stringify({ message: 'error' }), { status: 500 })
  }
};
