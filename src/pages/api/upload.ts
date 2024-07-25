import type { APIRoute } from 'astro'
import { uploadToR2 } from '../../utils/r2'
import {
  generateNewChunkList,
  generateSentenceList
} from '../../utils/splitChunks'
import { getResolvedPDFJS } from 'unpdf'
import { createEmbedding } from '../../utils/createEmbedding'

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!(file instanceof File)) {
    return new Response('No file uploaded', { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const unit8Array = new Uint8Array(arrayBuffer)

  // const uploadedMetadata = await uploadToR2(unit8Array)

  const { getDocument } = await getResolvedPDFJS()
  const doc = await getDocument(unit8Array).promise

  console.log('Extracting text from PDF')
  const sentenceList = await generateSentenceList(doc)

  console.log('Generating new chunk list')
  const chunkList = generateNewChunkList(sentenceList)

  console.log('Creating embeddings')
  await createEmbedding(chunkList)

  console.log('Done')
  return new Response(JSON.stringify({ ok: true }))
}
