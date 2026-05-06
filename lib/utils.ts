export function genId(): string {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function truncate(str: string, n = 42): string {
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function renderMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  let html = escaped
    // code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_: string, lang: string, code: string) => {
      const trimmed = code.trim()
      return `<pre><div class="code-header"><span>${lang || 'code'}</span><button class="copy-code-btn" data-code="${encodeURIComponent(trimmed)}">copy</button></div><code>${trimmed}</code></pre>`
    })
    // inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // hr
    .replace(/^---$/gm, '<hr />')
    // unordered list items
    .replace(/^[\*\-] (.+)$/gm, '<li>$1</li>')
    // ordered list items
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // wrap consecutive list items
    .replace(/(<li>[\s\S]+?<\/li>(\n<li>[\s\S]+?<\/li>)*)/g, (m: string) => `<ul>${m}</ul>`)
    // links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />')

  return `<p>${html}</p>`
}

export function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const STORAGE_KEY = 'aether_conversations'

export function loadConversations() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveConversations(convs: unknown[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs))
}
