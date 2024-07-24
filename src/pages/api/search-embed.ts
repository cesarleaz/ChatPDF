import type { APIRoute } from 'astro';
import axios from 'axios';
import getOpenAIBaseUrl from '../../utils/getOpenAIBaseUrl';
import { supabaseClient } from '../../utils/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { query,  matches } = (await request.formData()) as any;

    const input = query.replace(/\n/g, ' ');

    const embedRes = await axios(`${getOpenAIBaseUrl()}/v1/embeddings`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.OPENAI_API_KEY}`
      },
      method: 'POST',
      data: {
        model: 'togethercomputer/m2-bert-80M-32k-retrieval',
        input
      }
    });

    const { embedding } = embedRes.data.data[0];

    const { data: chunks, error } = await supabaseClient.rpc('chatgpt_search', {
      query_embedding: embedding,
      similarity_threshold: 0.01,
      match_count: matches
    });

    if (error) {
      console.error(error);
      return new Response('Error', { status: 500 });
    }

    return new Response(JSON.stringify(chunks))
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'error' }), { status: 500 })
  }
};
