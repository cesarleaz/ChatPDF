import type { APIRoute } from 'astro';
import { OpenAIStream } from '../../utils/openaiStream';

export const config = {
  runtime: 'edge'
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { prompt } = (await request.json()) as {
      prompt: string;
    };

    const stream = await OpenAIStream(prompt);

    return new Response(stream);
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};
