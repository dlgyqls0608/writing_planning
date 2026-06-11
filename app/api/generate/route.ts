import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIClient } from '@/lib/ai/client'
import { getSystemPrompt, getQuestionPrompt, buildUserPrompt, getModelConfig } from '@/lib/ai/prompts'
import type { GenerateRequest } from '@/types'

export const maxDuration = 300 // Vercel Pro: up to 300s for AI streaming

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  let body: GenerateRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })
  }

  if (!body.type || !body.projectId || !body.userInput?.trim()) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
  }

  // Fetch project meta for richer prompts
  const { data: project } = await supabase
    .from('projects')
    .select('title, genre, target_episodes, logline')
    .eq('id', body.projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })

  // Questions mode: return clarifying questions as JSON (non-streamed)
  if (body.mode === 'questions') {
    const result = await getAIClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: getQuestionPrompt(body.type),
      messages: [{
        role: 'user',
        content: `작품명: ${project.title}\n장르: ${project.genre}\n\n작가 아이디어:\n${body.userInput}`,
      }],
    })
    const raw = result.content[0].type === 'text' ? result.content[0].text : '[]'
    try {
      const questions = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] ?? '[]')
      return NextResponse.json({ questions })
    } catch {
      return NextResponse.json({ questions: [] })
    }
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Keep-alive: send SSE comment every 10s to prevent proxy/CDN timeout
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(': keepalive\n\n')) } catch {}
      }, 10_000)

      try {
        const { model, maxTokens } = getModelConfig(body.type)
        const aiStream = getAIClient().messages.stream({
          model,
          max_tokens: maxTokens,
          system: getSystemPrompt(body.type),
          messages: [
            {
              role: 'user',
              content: buildUserPrompt(body, {
                title: project.title,
                genre: project.genre,
                targetEpisodes: project.target_episodes,
              }),
            },
          ],
        })

        for await (const chunk of aiStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
            )
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        const msg = err instanceof Error ? err.message : '생성 중 오류가 발생했습니다'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
      } finally {
        clearInterval(heartbeat)
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx/Vercel: disable response buffering
    },
  })
}
