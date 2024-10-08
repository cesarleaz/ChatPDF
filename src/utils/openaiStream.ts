import {
  createParser,
  type ParsedEvent,
  type ReconnectInterval
} from 'eventsource-parser'
import getOpenAIBaseUrl from './getOpenAIBaseUrl'

export const OpenAIStream = async (prompt: string, context: string) => {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const res = await fetch(`${getOpenAIBaseUrl()}/v1/chat/completions`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.OPENAI_API_KEY}`
    },
    method: 'POST',
    body: JSON.stringify({
      model: 'meta-llama/Meta-Llama-3-70B-Instruct-Turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that accurately answers queries using GitHub Privacy Statement. Use the text provided to form your answer, but avoid copying word-for-word from the context. Try to use your own words when possible. Keep your answer under 5 sentences. Be accurate, helpful, concise, and clear.`
        },
        {
          role: 'user',
          content: `\nUse the following text to provide an answer to the query: "${prompt}"\n\n${context}`
        }
      ],
      temperature: 0.1,
      stream: true
    })
  })

  if (res.status !== 200) {
    throw new Error('OpenAI API returned an error' + (await res.text()))
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data

          if (data === '[DONE]') {
            controller.close()
            return
          }

          try {
            const json = JSON.parse(data)
            const text = json.choices[0].delta.content
            const queue = encoder.encode(text)
            controller.enqueue(queue)
          } catch (e) {
            controller.error(e)
          }
        }
      }

      const parser = createParser(onParse)

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk))
      }
    }
  })

  return stream
}
