import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'

// In-memory conversation store (per session)
const conversations = new Map<string, { role: string; content: string }[]>()

const SYSTEM_PROMPT = `You are RailOpt AI Assistant, an expert in Indian Railways block planning and maintenance optimization. You help planners, engineers, and control office staff with:

- Block planning and scheduling optimization
- Conflict detection and resolution strategies
- Maintenance request prioritization
- Corridor and section availability analysis
- Approval workflow guidance
- Indian Railways operational rules (IRCA, G&SR)

Key facts about Indian Railways:
- 67,956 km route, 18 zones, 72 divisions
- ~13,000 trains daily
- Block windows typically 2-4 hours, preferred 22:00-06:00
- Minimum 30-minute buffer between block and train
- Approval workflow: AI Recommend → Planner Review → Dept Verification → Planner Finalize → Control Office Approve

Be concise, practical, and specific to railway operations. Use Indian Railways terminology (block section, token, bell code, etc.).`

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get or create conversation
    const key = sessionId || 'default'
    let history = conversations.get(key) || []

    // Add user message to history
    history.push({ role: 'user', content: message })

    // Trim to last 20 messages to keep context manageable
    if (history.length > 20) {
      history = history.slice(-20)
    }

    // Build the full prompt with conversation context
    const contextLines = history
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n')

    const fullPrompt = `Conversation so far:\n${contextLines}\n\nAssistant:`

    // Call LLM
    let aiResponse: string
    try {
      aiResponse = await callLLM(fullPrompt, SYSTEM_PROMPT)
    } catch {
      aiResponse = 'I\'m having trouble connecting to the AI service. Please try again in a moment.'
    }

    // Save AI response to history
    history.push({ role: 'assistant', content: aiResponse })
    conversations.set(key, history)

    return NextResponse.json({
      response: aiResponse,
      messageCount: history.length,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate response',
        response: 'I\'m having trouble connecting. Please try again in a moment.',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')
  if (sessionId) {
    conversations.delete(sessionId)
  }
  return NextResponse.json({ success: true })
}
