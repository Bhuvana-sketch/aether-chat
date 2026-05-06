'use client'

import { STARTER_PROMPTS } from '@/lib/types'

interface EmptyStateProps {
  onPrompt: (prompt: string) => void
}

export default function EmptyState({ onPrompt }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-orb">Æ</div>
      <div className="empty-title">What can I help with?</div>
      <div className="empty-sub">
        Aether is a powerful AI assistant ready to help you think, create, code,
        and explore anything.
      </div>
      <div className="starter-grid">
        {STARTER_PROMPTS.map((s) => (
          <button
            key={s.prompt}
            className="starter-card"
            onClick={() => onPrompt(s.prompt)}
          >
            <div className="starter-icon">{s.icon}</div>
            <div className="starter-label">{s.label}</div>
            <div className="starter-sub">{s.sub}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
