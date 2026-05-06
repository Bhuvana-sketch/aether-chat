'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Trash2, Download, Menu } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import MessageBubble from '@/components/MessageBubble'
import EmptyState from '@/components/EmptyState'
import ChatInput from '@/components/ChatInput'
import Toast from '@/components/Toast'
import {
  Message,
  Conversation,
  ModelId,
} from '@/lib/types'
import {
  genId,
  loadConversations,
  saveConversations,
  truncate,
  downloadText,
  renderMarkdown,
} from '@/lib/utils'

type StatusType = 'idle' | 'streaming' | 'error'

export default function Page() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [model, setModel] = useState<ModelId>('llama-3.3-70b')
  const [streaming, setStreaming] = useState(false)
  const [statusText, setStatusText] = useState('Ready')
  const [statusType, setStatusType] = useState<StatusType>('idle')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const convs = loadConversations()
    setConversations(convs)
  }, [])

  // Persist conversations
  const persistConvs = useCallback((convs: Conversation[]) => {
    setConversations(convs)
    saveConversations(convs)
  }, [])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMsgId])

  // ── Conversation management ──
  function newChat() {
    const c: Conversation = {
      id: genId(),
      title: 'New conversation',
      messages: [],
      model,
      created: Date.now(),
      updatedAt: Date.now(),
    }
    persistConvs([...conversations, c])
    setActiveId(c.id)
    setMessages([])
    setSidebarOpen(false)
  }

  function selectConv(id: string) {
    const c = conversations.find((x) => x.id === id)
    if (!c) return
    setActiveId(id)
    setMessages(c.messages)
    setModel((c.model as ModelId) || 'llama-3.3-70b')
    setSidebarOpen(false)
  }

  function deleteConv(id: string) {
    const updated = conversations.filter((x) => x.id !== id)
    persistConvs(updated)
    if (activeId === id) {
      setActiveId(null)
      setMessages([])
    }
  }

  function saveMessages(msgs: Message[], id: string | null, currentConvs: Conversation[]) {
    if (!id) return currentConvs
    const updated = currentConvs.map((c) => {
      if (c.id !== id) return c
      const title =
        c.title === 'New conversation' && msgs[0]
          ? truncate(msgs[0].content)
          : c.title
      return { ...c, messages: msgs, model, title, updatedAt: Date.now() }
    })
    persistConvs(updated)
    return updated
  }

  // ── Send message ──
  async function sendMessage(promptOverride?: string) {
    const text = (promptOverride ?? input).trim()
    if (!text || streaming) return

    // Ensure we have a conversation
    let currentId = activeId
    let currentConvs = conversations

    if (!currentId) {
      const c: Conversation = {
        id: genId(),
        title: 'New conversation',
        messages: [],
        model,
        created: Date.now(),
        updatedAt: Date.now(),
      }
      currentConvs = [...conversations, c]
      persistConvs(currentConvs)
      currentId = c.id
      setActiveId(c.id)
    }

    const userMsg: Message = { id: genId(), role: 'user', content: text, time: Date.now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    saveMessages(newMessages, currentId, currentConvs)

    // AI placeholder
    const aiId = genId()
    const aiMsg: Message = { id: aiId, role: 'assistant', content: '', time: Date.now() }
    setStreamingMsgId(aiId)
    setMessages([...newMessages, aiMsg])
    setStreaming(true)
    setStatusText('Thinking…')
    setStatusType('streaming')

    abortRef.current = new AbortController()

    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const resp = await fetch('/api/chat', {
        method: 'POST',
        signal: abortRef.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, model }),
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }))
        throw new Error(err.error || `HTTP ${resp.status}`)
      }

      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const ev = JSON.parse(data)
            if (ev.error) throw new Error(ev.error)
            if (ev.text) {
              fullText += ev.text
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId ? { ...m, content: fullText } : m
                )
              )
              setStatusText(`Generating… ${fullText.length} chars`)
            }
          } catch {}
        }
      }

      const finalMessages = [...newMessages, { ...aiMsg, content: fullText }]
      setMessages(finalMessages)
      setStatusText(`Done · ${fullText.length} chars`)
      setStatusType('idle')
      saveMessages(finalMessages, currentId, currentConvs)
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError'
      if (isAbort) {
        setStatusText('Stopped')
        setStatusType('idle')
        // Keep whatever was streamed
        setMessages((prev) => {
          const kept = prev.filter((m) => !(m.id === aiId && m.content === ''))
          saveMessages(kept, currentId!, currentConvs)
          return kept
        })
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId ? { ...m, content: `⚠ Error: ${msg}` } : m
          )
        )
        setStatusText('Error')
        setStatusType('error')
      }
    } finally {
      setStreaming(false)
      setStreamingMsgId(null)
      abortRef.current = null
    }
  }

  function stopStream() {
    abortRef.current?.abort()
  }

  function retryMsg(idx: number) {
    if (streaming) return
    const trimmed = messages.slice(0, idx)
    setMessages(trimmed)
    const lastUser = [...trimmed].reverse().find((m) => m.role === 'user')
    if (lastUser) {
      sendMessage(lastUser.content)
    }
  }

  function copyMsg(idx: number) {
    const m = messages[idx]
    if (!m) return
    navigator.clipboard.writeText(m.content).then(() => setToast('Copied to clipboard'))
  }

  function clearConv() {
    if (!activeId) return
    setMessages([])
    const updated = conversations.map((c) =>
      c.id === activeId ? { ...c, messages: [], title: 'New conversation', updatedAt: Date.now() } : c
    )
    persistConvs(updated)
    setToast('Conversation cleared')
  }

  function exportConv() {
    if (!messages.length) { setToast('Nothing to export'); return }
    const text = messages
      .map((m) => `[${m.role === 'user' ? 'You' : 'Aether'}]\n${m.content}`)
      .join('\n\n---\n\n')
    downloadText(text, 'aether-chat.txt')
    setToast('Exported!')
  }

  function handleModelChange(m: ModelId) {
    setModel(m)
    if (activeId) {
      const updated = conversations.map((c) =>
        c.id === activeId ? { ...c, model: m } : c
      )
      persistConvs(updated)
    }
  }

  const activeConv = conversations.find((c) => c.id === activeId)
  const convTitle = activeConv?.title || 'New conversation'

  return (
    <div className="app">
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeId}
        model={model}
        onNewChat={newChat}
        onSelectConv={selectConv}
        onDeleteConv={deleteConv}
        onModelChange={handleModelChange}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <button
            className="icon-btn mobile-toggle"
            onClick={() => setSidebarOpen(true)}
            title="Menu"
          >
            <Menu size={15} />
          </button>
          <div className="topbar-title">{convTitle}</div>
          <div className="topbar-actions">
            <button className="icon-btn" onClick={clearConv} title="Clear conversation">
              <Trash2 size={14} />
            </button>
            <button className="icon-btn" onClick={exportConv} title="Export conversation">
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-wrap">
          {messages.length === 0 ? (
            <EmptyState onPrompt={(p) => sendMessage(p)} />
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  index={i}
                  onCopy={copyMsg}
                  onRetry={retryMsg}
                  isStreaming={streaming && msg.id === streamingMsgId}
                />
              ))}

              {/* Typing indicator while waiting for first token */}
              {streaming &&
                streamingMsgId &&
                messages.find((m) => m.id === streamingMsgId)?.content === '' && (
                  <div className="msg ai">
                    <div className="msg-avatar">Æ</div>
                    <div className="msg-body">
                      <div className="msg-meta">
                        <span className="msg-name">Aether</span>
                      </div>
                      <div className="bubble">
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
                          <div className="typing-dot" />
                          <div className="typing-dot" />
                          <div className="typing-dot" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Status bar */}
        <div style={{ padding: '0 20px' }}>
          <div className="status-bar">
            <div className={`status-dot ${statusType === 'streaming' ? 'streaming' : statusType === 'error' ? 'error' : ''}`} />
            <span>{statusText}</span>
          </div>
        </div>

        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => sendMessage()}
          onStop={stopStream}
          disabled={streaming}
          streaming={streaming}
        />
      </div>

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  )
}
