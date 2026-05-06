# Aether — AI Chat 

A production-ready AI chat app built with Next.js 14 and Groq.  


## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI**: Groq API (`groq-sdk`) — Llama 3.3, Mixtral
- **Styling**: Pure CSS with CSS variables
- **Fonts**: Syne + DM Sans + DM Mono
- **Icons**: Lucide React


## Getting Started

### 1. Get your Groq API Key (30 seconds)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign in with your Google account
3. Go to **API Keys** → **Create API Key**
4. Copy the key (starts with `gsk_`)

### 2. Install & configure

```bash
npm install
copy .env.local.example .env.local
```

Edit `.env.local`:
```
GROQ_API_KEY=gsk_your-key-here
```

### 3. Run

```bash
npm run dev
# → http://localhost:3000
```

## Deploy to Vercel (Free)

1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add `GROQ_API_KEY` in Environment Variables
4. Deploy → get a public URL

## Project Structure

```
aether-chat/
├── app/
│   ├── api/chat/route.ts   # Groq streaming API route
│   ├── globals.css          # All styles
│   ├── layout.tsx           # Root layout + fonts
│   └── page.tsx             # Main chat page
├── components/
│   ├── Sidebar.tsx          # Conversation list + model picker
│   ├── MessageBubble.tsx    # Markdown messages with copy/retry
│   ├── EmptyState.tsx       # Starter prompts
│   ├── ChatInput.tsx        # Textarea + send/stop
│   └── Toast.tsx            # Notifications
├── lib/
│   ├── types.ts             # TypeScript types + model list
│   └── utils.ts             # Markdown, storage, helpers
└── public/favicon.svg
```

## License

MIT
