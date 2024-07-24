import { Card, Form, Input } from 'antd';
import axios from 'axios';
import { Fragment, useRef, useState } from 'react';
import Message from './Message';

interface ChatWindowProps {
  className?: string;
}

interface MessageItem {
  question?: string;
  reply?: string;
  references?: { id: number; content: string; page_num: number }[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ className }) => {
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [query, setQuery] = useState('');
  const [messageList, setMessageList] = useState<MessageItem[]>([]);


  const scrollToBottom = () => {
    setTimeout(() => {
      const chatWindow = chatWindowRef.current;

      if (chatWindow) {
        chatWindow.scrollTop = chatWindow.scrollHeight + 300;
      }
    }, 0);
  };

  const onReply = async (value: string) => {
    try {
      setLoading(true);
      const embedRes = await axios('/api/search-embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: { query: value, matches: 5 }
      });

      const prompt = `
      Use the following text to provide an answer to the query: "${value}"

      ${embedRes.data?.map((d: any) => d.content).join('\n\n')}
      `;

      const answerResponse = await fetch('/api/search-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });
      setLoading(false);

      if (!answerResponse.ok) {
        throw new Error(answerResponse.statusText);
      }

      const data = answerResponse.body;
      if (!data) {
        throw new Error('No data');
      }
      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        console.log(chunkValue);

        setMessageList(pre => {
          return [
            ...pre.slice(0, -1),
            {
              ...pre.slice(-1),
              reply: pre.slice(-1)[0].reply + chunkValue,
              references: embedRes.data
            }
          ];
        });
        requestAnimationFrame(() => scrollToBottom());
      }

      scrollToBottom();
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  const onSearch = async (value: string) => {
    setQuery('');

    setMessageList([...messageList, { question: value.trim() }, { reply: '' }]);
    scrollToBottom();
    onReply(value);
  };

  return (
    <>
      <Card
        style={{ width: 500 }}
        className={className}
        bodyStyle={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0'
        }}
        title="Chat with PDF"
        bordered={false}
      >
        <div
          ref={chatWindowRef}
          className="scroll-smooth flex flex-col items-start flex-1 overflow-auto px-6"
        >
          {messageList.map((item, index) => (
            <Fragment key={index}>
              {item.question ? (
                <Message isQuestion text={item.question} />
              ) : (
                <Message
                  loading={loading && index === messageList.length - 1}
                  references={item.references}
                  text={item.reply || ''}
                />
              )}
            </Fragment>
          ))}
        </div>

        <div className="p-4 pb-0 border-t border-t-gray-200 border-solid border-x-0 border-b-0">
          <Input.Search
            enterButton="Ask Question"
            size="large"
            value={query}
            placeholder="input your question"
            allowClear
            loading={loading}
            onChange={e => setQuery(e.target.value)}
            onSearch={onSearch}
          />
        </div>
      </Card>
    </>
  );
};

export default ChatWindow;
