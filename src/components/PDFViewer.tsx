export default function PDFViewer({ src }: { src?: string }) {
    if (!src) return
    return (
        <iframe src={src} width="100%" height="100%" />
    )
}
