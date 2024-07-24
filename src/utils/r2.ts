import { randomUUID} from 'node:crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export const R2 = new S3Client({
    region: 'auto',
    endpoint: import.meta.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: import.meta.env.R2_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.R2_SECRET_ACCESS_KEY,
    },
});

export async function uploadToR2(file: File) {
    const now = new Date().toISOString().slice(0, 10)
    const id = randomUUID()
    const key = `files/${now}/${id}`

    const arrayBuffer = await file.arrayBuffer();
    const unit8Array = new Uint8Array(arrayBuffer);

    await R2.send(new PutObjectCommand({
        Bucket: import.meta.env.R2_BUCKET_NAME,
        Key: key,
        Body: unit8Array,
        ContentType: 'application/pdf'
    }))
    
    return { date: now, id, fileKey: key }
}
