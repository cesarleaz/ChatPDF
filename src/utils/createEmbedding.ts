import OpenAI from 'openai'
import { supabaseClient } from './supabaseClient'
import getOpenAIBaseUrl from './getOpenAIBaseUrl'

export async function createEmbedding(
  sentenceList: {
    content: string
    content_length: number
    content_tokens: number
    page_num: number
  }[]
) {
  const openai = new OpenAI({
    apiKey: import.meta.env.OPENAI_API_KEY,
    baseURL: `${getOpenAIBaseUrl()}/v1` || undefined
  })

  for (let i = 0; i < sentenceList.length; i++) {
    const chunk = sentenceList[i]
    const { content, content_length, content_tokens, page_num } = chunk

    if (content.length < 1 || content_length < 1) continue

    const embeddingResponse = await openai.embeddings.create({
      model: 'togethercomputer/m2-bert-80M-32k-retrieval',
      input: content
    })

    const [{ embedding }] = embeddingResponse.data

    const { error } = await supabaseClient
      .from('chatgpt')
      .insert({
        content,
        content_length,
        content_tokens,
        page_num,
        embedding
      })
      .select('*')

    if (error) {
      console.log('error', error)
    } else {
      console.log('saved', i)
    }

    // 防止触发openai的每分钟限制
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }
}
