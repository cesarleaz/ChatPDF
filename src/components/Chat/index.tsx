import { Card, Form, Input } from 'antd'
import { Fragment, useRef, useState } from 'react'
import Message from './Message'
import PDFViewer from '../PDFViewer'

interface MessageItem {
  question?: string
  reply?: string
  references?: { id: number; content: string; page_num: number }[]
  streaming?: boolean
}

export default function Chat() {
  const [file, setFile] = useState<string>()
  const chatWindowRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [query, setQuery] = useState('')
  const [messageList, setMessageList] = useState<MessageItem[]>([])

  const scrollToBottom = () => {
    setTimeout(() => {
      const chatWindow = chatWindowRef.current

      if (chatWindow) {
        chatWindow.scrollTop = chatWindow.scrollHeight + 300
      }
    }, 0)
  }

  const onReply = async (value: string) => {
    setLoading(true)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: value })
      })

      if (!res.ok) {
        throw new Error('Failed to fetch')
      }

      const reader = await res.body?.getReader()
      const decoder = new TextDecoder()
      let done = false
      while (!done) {
        const { value, done: doneReading } = (await reader?.read()) as any
        done = doneReading
        const chunkValue = decoder.decode(value)
        console.log(chunkValue)

        setMessageList((pre) => {
          const state = structuredClone(pre)
          state[state.length - 1].reply += chunkValue
          return state
        })
        requestAnimationFrame(() => scrollToBottom())
      }

      scrollToBottom()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
      setMessageList((pre) => {
        const state = structuredClone(pre)
        state[state.length - 1].streaming = false
        return state
      })
    }
  }

  const onSearch = async (value: string) => {
    setQuery('')

    setMessageList([
      ...messageList,
      { question: value.trim() },
      { reply: '', streaming: true }
    ])
    scrollToBottom()
    onReply(value)
  }

  return (
    <div className="flex flex-row justify-center m-auto w-5/6 space-x-4 h-full overflow-hidden">
      <Card
        style={{ width: 500 }}
        className="flex flex-col h-full overflow-hidden"
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
                  loading={item.streaming && !item.reply?.length}
                  references={item.references}
                  text={item.reply}
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
            onChange={(e) => setQuery(e.target.value)}
            onSearch={onSearch}
          />
        </div>
      </Card>

      <Card
        style={{ width: 700 }}
        className="h-full overflow-auto scroll-smooth"
        bodyStyle={{ padding: 0 }}
      >
        <PDFViewer src={file} />
      </Card>
    </div>
  )
}
