export async function loadFile(file: File) {
    const data = new FormData()
    data.set('file', file)

    const res = await fetch('/api/upload', {
        method: 'POST',
        body: data
    })

    if (!res.ok) {
        throw new Error('Failed to upload file')
    }

    return await res.json()
}
