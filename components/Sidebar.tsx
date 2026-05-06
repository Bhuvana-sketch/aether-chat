'use client'

import { Plus, X, MessageSquare } from 'lucide-react'
import { Conversation, MODELS, ModelId } from '@/lib/types'

interface SidebarProps {
  open: boolean
  conversations: Conversation[]
  activeId: string | null
  model: ModelId
  onNewChat: () => void
  onSelectConv: (id: string) => void
  onDeleteConv: (id: string) => void
  onModelChange: (m: ModelId) => void
  onClose: () => void
}

export default function Sidebar({
  open,
  conversations,
  activeId,
  model,
  onNewChat,
  onSelectConv,
  onDeleteConv,
  onModelChange,
  onClose,
}: SidebarProps) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-mark">Æ</div>
        <span className="logo-name">Aether</span>
        <div style={{ flex: 1 }} />
        <button
          className="icon-btn close-sidebar-btn"
          style={{ display: 'none' }}
          onClick={onClose}
          title="Close menu"
        >
          <X size={14} />
        </button>
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        <Plus size={14} />
        New conversation
      </button>

      <div className="sidebar-section-label">Recent</div>

      <div className="conv-list">
        {conversations.length === 0 ? (
          <div className="conv-empty">No conversations yet</div>
        ) : (
          [...conversations]
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((c) => (
              <div
                key={c.id}
                className={`conv-item ${c.id === activeId ? 'active' : ''}`}
                onClick={() => onSelectConv(c.id)}
              >
                <MessageSquare size={13} className="conv-item-icon" />
                <span className="conv-item-title">{c.title}</span>
                <button
                  className="conv-item-del"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteConv(c.id)
                  }}
                >
                  ×
                </button>
              </div>
            ))
        )}
      </div>

      <div className="sidebar-footer">
        <div className="model-select-label">Model</div>
        <div className="model-select-wrap">
          <select
            className="model-select"
            value={model}
            onChange={(e) => onModelChange(e.target.value as ModelId)}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} — {m.description}
              </option>
            ))}
          </select>
          <span className="model-select-arrow">▾</span>
        </div>
      </div>
    </aside>
  )
}
