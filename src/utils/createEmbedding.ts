import { openai } from './openai'
import { supabaseClient } from './supabaseClient'

export async function createEmbedding(
  sentenceList: {
    content: string
    content_length: number
    content_tokens: number
    page_num: number
  }[]
) {
  for (let i = 0; i < sentenceList.length; i++) {
    const chunk = sentenceList[i]
    const { content, content_length, content_tokens, page_num } = chunk

    if (content.length < 1 || content_length < 1) continue

    const embedRes = await openai.embeddings.create({
      model: 'togethercomputer/m2-bert-80M-32k-retrieval',
      input: content
    })

    const { embedding } = embedRes.data[0]

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

export async function getChunksEmbeddings(query: string, matches: number) {
  const embedRes = await openai.embeddings.create({
    model: 'togethercomputer/m2-bert-80M-32k-retrieval',
    input: query
  })

  const { embedding } = embedRes.data[0]

  const { data: chunks } = await supabaseClient.rpc('chatgpt_search', {
    query_embedding: embedding,
    similarity_threshold: 0.01,
    match_count: matches
  })

  return chunks
}
