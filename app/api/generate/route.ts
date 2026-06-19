import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getAIClient } from '@/lib/ai/client'
import {
  getSystemPrompt,
  getQuestionPrompt,
  buildUserPrompt,
  getModelConfig,
  COMPRESSION_SYSTEM_PROMPT,
  buildCompressionPrompt,
} from '@/lib/ai/prompts'
import type { GenerateRequest, StoryContext } from '@/types'

export const maxDuration = 300

async function compressStoryContext(
  existing: StoryContext,
  newContent: string,
  docType: GenerateRequest['type'],
): Promise<StoryContext> {
  const result = await getAIClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    system: COMPRESSION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildCompressionPrompt(existing, newContent, docType) }],
  })

  const raw = result.content[0].type === 'text' ? result.content[0].text : ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return existing

  try {
    const parsed = JSON.parse(match[0])
    return {
      core:     String(parsed.core     ?? existing.core     ?? '').slice(0, 80),
      active:   String(parsed.active   ?? existing.active   ?? '').slice(0, 100),
      upcoming: String(parsed.upcoming ?? existing.upcoming ?? '').slice(0, 80),
    }
  } catch {
    return existing
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  let body: GenerateRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })
  }

  if (!body.type || !body.projectId || !body.userInput?.trim()) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
  }

  const [project] = await db
    .select({
      title:          projects.title,
      genre:          projects.genre,
      target_episodes: projects.target_episodes,
      logline:        projects.logline,
      story_context:  projects.story_context,
    })
    .from(projects)
    .where(and(eq(projects.id, body.projectId), eq(projects.user_id, session.user.id)))
    .limit(1)

  if (!project) {
    return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
  }

  const storyContext: StoryContext = (project.story_context as StoryContext) ?? {
    core: '', active: '', upcoming: '',
  }

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
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(': keepalive\n\n')) } catch {}
      }, 5_000)

      let generatedContent = ''

      try {
        const { model, maxTokens } = getModelConfig(body.type)
        const aiStream = getAIClient().messages.stream({
          model,
          max_tokens: maxTokens,
          system: getSystemPrompt(body.type),
          messages: [{
            role: 'user',
            content: buildUserPrompt(body, {
              title: project.title,
              genre: project.genre,
              targetEpisodes: project.target_episodes,
              storyContext,
            }),
          }],
        })

        for await (const chunk of aiStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            generatedContent += chunk.delta.text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
            )
          }
        }

        // [DONE] 먼저 전송 → 클라이언트가 즉시 완료 인식
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))

        // 컨텍스트 압축은 [DONE] 이후 백그라운드에서 처리
        if (generatedContent) {
          try {
            const compressed = await compressStoryContext(storyContext, generatedContent, body.type)
            await db
              .update(projects)
              .set({ story_context: compressed })
              .where(eq(projects.id, body.projectId))
          } catch {
            // 압축 실패는 생성 결과에 영향 없음
          }
        }
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
      'X-Accel-Buffering': 'no',
    },
  })
}
