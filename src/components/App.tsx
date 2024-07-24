import { Button, Card, type UploadProps } from 'antd';
import { message, Upload } from 'antd';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import ChatWindow from '../components/chatWindow';
import { InboxOutlined } from '@ant-design/icons';
import eventEmitter from '../utils/eventEmitter';
import PDFViewer from './PDFViewer';

const { Dragger } = Upload;

export default function Home() {
  const [file, setFile] = useState<string>();
  const disabledUpload = false;
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(false);
  const pdfRef = useRef<unknown>();
  const sentenceRef = useRef<string[]>();

  function scrollToPage(num: number) {
    // @ts-ignore
    pdfRef?.current.pages[num - 1].scrollIntoView();
  }

  useEffect(() => {
    // @ts-ignore
    eventEmitter.on('scrollToPage', scrollToPage);

    return () => {
      // @ts-ignore
      eventEmitter.off('scrollToPage', scrollToPage);
    };
  }, []);

  async function generateEmbedding(sentenceList: any[]) {
    setLoading(true);
    const res = await axios('/api/split-chunks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: { sentenceList }
    });

    const { chunkList } = res.data;
    const chunkSize = 2; // 每组的元素个数

    // 由于vercel单个接口10秒限制，所以分批次处理
    for (let i = 0; i < chunkList.length; i += chunkSize) {
      const chunk = chunkList.slice(i, i + chunkSize); // 取出当前组的元素

      await axios('/api/embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          sentenceList: chunk
        }
      });
    }
    setLoading(false);
  }

  const props: UploadProps = {
    name: 'file',
    beforeUpload: file => {
      // file to URL and set state of file with url
      const url = URL.createObjectURL(file);
      setFile(url);

      return false;
    },
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        void message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        void message.error(`${info.file.name} file upload failed.`);
      }
    }
  };

  const onReading = async () => {
    generateEmbedding(sentenceRef.current as string[]);
  };

  return (
    <main className="bg-slate-100 py-4 h-screen">
      <div className="flex flex-row justify-center m-auto w-5/6 space-x-4">
        {!disabledUpload && (
          <Button disabled={!file} loading={loading} type="primary" onClick={onReading}>
            start reading
          </Button>
        )}
        {!disabledUpload && !file && (
          <Dragger {...props}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">
              Support for a single or bulk upload. Strictly prohibit from uploading company data
              or other band files
            </p>
          </Dragger>
        )}
      </div>
      <div className="flex flex-row justify-center m-auto w-5/6 space-x-4 h-full overflow-hidden">
        <ChatWindow className="flex flex-col h-full overflow-hidden" />

        <Card
          style={{ width: 700 }}
          className="h-full overflow-auto scroll-smooth"
          bodyStyle={{ padding: 0 }}
        >
          <PDFViewer src={file} />
        </Card>
      </div>
    </main>
  );
};

