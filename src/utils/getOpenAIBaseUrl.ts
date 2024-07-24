export default function getOpenAIBaseUrl() {
  return import.meta.env.OPENAI_API_PROXY || 'https://api.openai.com';
}
