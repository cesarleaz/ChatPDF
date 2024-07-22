import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import getOpenAIBaseUrl from '../../utils/getOpenAIBaseUrl';
import { supabaseClient } from '../../utils/supabaseClient';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { query,  matches } = req.body;

    const input = query.replace(/\n/g, ' ');

    const embedRes = await axios(`${getOpenAIBaseUrl()}/v1/embeddings`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
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

    res.status(200).json(chunks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'error' });
  }
};

export default handler;
