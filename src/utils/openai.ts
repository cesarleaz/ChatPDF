import OpenAI from 'openai'
import getOpenAIBaseUrl from './getOpenAIBaseUrl'

export const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
  baseURL: `${getOpenAIBaseUrl()}/v1` || undefined
})
