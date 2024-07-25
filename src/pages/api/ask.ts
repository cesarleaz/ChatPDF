import { getChunksEmbeddings } from '../../utils/createEmbedding'
import { OpenAIStream } from '../../utils/openaiStream'
import type { APIRoute } from 'astro'

export const POST: APIRoute = async ({ request }) => {
  try {
    const { prompt } = (await request.json()) as {
      prompt: string
    }

    const chunks = await getChunksEmbeddings(prompt, 5)

    const context = chunks.map((d: any) => d.content).join('\n\n')

    const stream = await OpenAIStream(prompt, context)

    return new Response(stream)
  } catch (error) {
    console.error(error)
    return new Response('Error', { status: 500 })
  }
}
