'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/lib/types'
import { renderMarkdown, formatTime } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  index: number
  onCopy: (idx: number) => void
  onRetry: (idx: number) => void
  isStreaming?: boolean
}

export default function MessageBubble({
  message,
  index,
  onCopy,
  onRetry,
  isStreaming,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const bubbleRef = useRef<HTMLDivElement>(null)

  // Bind copy-code buttons after render
  useEffect(() => {
    if (!bubbleRef.current) return
    const btns = bubbleRef.current.querySelectorAll<HTMLButtonElement>('.copy-code-btn')
    btns.forEach((btn) => {
      btn.onclick = () => {
        const code = decodeURIComponent(btn.dataset.code || '')
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = 'copied!'
          setTimeout(() => (btn.textContent = 'copy'), 1600)
        })
      }
    })
  })

  return (
    <div className={`msg ${isUser ? 'user' : 'ai'}`}>
      <div className="msg-avatar">{isUser ? 'U' : 'Æ'}</div>

      <div className="msg-body">
        <div className="msg-meta">
          <span className="msg-name">{isUser ? 'You' : 'Aether'}</span>
          <span>{formatTime(message.time)}</span>
        </div>

        {isUser ? (
          <div className="bubble">
            <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
          </div>
        ) : (
          <div
            className="bubble"
            ref={bubbleRef}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}

        {!isStreaming && (
          <div className="msg-actions">
            <button className="msg-action-btn" onClick={() => onCopy(index)}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <rect x="3.5" y="3.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1" />
                <path d="M7.5 3.5V2a.5.5 0 00-.5-.5H2A.5.5 0 001.5 2v5a.5.5 0 00.5.5h1.5" stroke="currentColor" strokeWidth="1" />
              </svg>
              Copy
            </button>
            {!isUser && (
              <button className="msg-action-btn" onClick={() => onRetry(index)}>
                ↺ Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
