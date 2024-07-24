import { loadFile } from "../services/upload";
import { Loader2, Inbox } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from 'react-hot-toast'

export default function FileUpload() {
    const [uploading, setUploading] = useState(false);

    const { getRootProps, getInputProps } = useDropzone({
		accept: { "application/pdf": [".pdf"] },
		maxFiles: 1,
		onDrop: async (acceptedFiles) => {
			const file = acceptedFiles[0];
			if (file.size > 10 * 1024 * 1024) {
				// bigger than 10mb!
				toast.error("File too large");
				return;
			}

			try {
				setUploading(true);
				const data = await loadFile(file)
			} catch (error) {
				console.error(error);
				toast.error("Something went wrong");
            } finally {
				setUploading(false);
			}
		},
	});

	return (
		<div className="p-2 bg-white rounded-xl">
			<div
				{...getRootProps({
					className:
						"border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",
				})}
			>
				<input {...getInputProps()} />
				{uploading ? (
					<>
						<Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
						<p className="mt-2 text-sm text-slate-400">Uploading...</p>
					</>
				) : (
					<>
						<Inbox className="w-10 h-10 text-blue-500" />
						<p className="mt-2 text-sm text-slate-400">Drop PDF Here</p>
					</>
				)}
			</div>
		</div>
	);
}
