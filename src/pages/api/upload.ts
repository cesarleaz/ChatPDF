import type { APIRoute } from "astro";
import { uploadToR2 } from '../../utils/r2'
import { generateNewChunkList } from '../../utils/splitChunks'
import pdfParse from 'pdf-parse'

export const POST: APIRoute = async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!(file instanceof File)) {
        return new Response('No file uploaded', { status: 400 })
    }

    // const uploadedMetadata = await uploadToR2(file)

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const parsed = await pdfParse(buffer)

    console.log(parsed)

    // const chunkList = generateNewChunkList(sentenceList)

    return new Response(JSON.stringify({ parsed }))
}
