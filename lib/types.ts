export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  time: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  model: string
  created: number
  updatedAt: number
}

export type ModelId =
  | 'llama-3.3-70b'
  | 'llama-3.1-8b'
  | 'gemma2-9b'

export interface Model {
  id: ModelId
  label: string
  description: string
}

export const MODELS: Model[] = [
  {
    id: 'llama-3.3-70b',
    label: 'Llama 3.3 70B',
    description: 'Best quality · free',
  },
  {
    id: 'llama-3.1-8b',
    label: 'Llama 3.1 8B',
    description: 'Ultra fast · free',
  },
 {
    id: 'gemma2-9b',
    label: 'Gemma 2 9B',
    description: 'Great for code · free',
  },
]

export const STARTER_PROMPTS = [
  {
    icon: '⚛️',
    label: 'Explain quantum entanglement',
    sub: 'in simple terms',
    prompt: 'Explain quantum entanglement in simple terms',
  },
  {
    icon: '🐍',
    label: 'Merge sorted arrays',
    sub: 'Python with explanation',
    prompt: 'Write a Python function to merge two sorted arrays efficiently',
  },
  {
    icon: '🗾',
    label: 'Tokyo 7-day itinerary',
    sub: 'Hidden gems included',
    prompt: 'Give me a creative 7-day travel itinerary for Tokyo, Japan',
  },
  {
    icon: '🚀',
    label: 'Review my startup idea',
    sub: 'Honest feedback & gaps',
    prompt:
      'Review my startup idea: an AI tool that summarises team meetings and creates action items automatically',
  },
]
