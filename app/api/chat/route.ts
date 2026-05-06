import Groq from 'groq-sdk'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

// Map our UI model IDs to Groq model names
const MODEL_MAP: Record<string, string> = {
  'llama-3.3-70b':   'llama-3.3-70b-versatile',
  'llama-3.1-8b':    'llama-3.1-8b-instant',
  'mixtral-8x7b':    'mixtral-8x7b-32768',
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const groqModel = MODEL_MAP[model] || 'llama-3.3-70b-versatile'

    const systemMessage = {
      role: 'system' as const,
      content: `You are Aether, a powerful and thoughtful AI assistant. You are knowledgeable, creative, and precise. You format responses with markdown when it aids clarity — use headers, bullet points, and code blocks where appropriate. Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`,
    }

    const groqMessages = [
      systemMessage,
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const stream = await groq.chat.completions.create({
      model: groqModel,
      messages: groqMessages,
      max_tokens: 8192,
      temperature: 0.7,
      stream: true,
    })

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              )
            }
            if (chunk.choices[0]?.finish_reason === 'stop') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            }
          }
          controller.close()
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
