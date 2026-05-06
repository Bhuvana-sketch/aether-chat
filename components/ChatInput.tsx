'use client'

import { useRef, useEffect, KeyboardEvent } from 'react'
import { Send, Square } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onStop: () => void
  disabled: boolean
  streaming: boolean
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  disabled,
  streaming,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [value])

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) onSend()
    }
  }

  return (
    <div className="input-area">
      <div className="input-wrap">
        <textarea
          ref={textareaRef}
          className="msg-input"
          placeholder="Message Aether…"
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={streaming}
        />
        <div className="input-bottom">
          <span className="input-hint">↵ send · ⇧↵ newline</span>
          <div className="input-right">
            <span className="token-counter">{value.length} chars</span>
            {streaming ? (
              <button className="stop-btn" onClick={onStop} title="Stop generating">
                <Square size={11} />
              </button>
            ) : (
              <button
                className="send-btn"
                onClick={onSend}
                disabled={disabled || !value.trim()}
                title="Send"
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
