import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { documents, projects } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { appendContentToPage } from '@/lib/notion/client'

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  if (!process.env.NOTION_API_KEY) {
    return NextResponse.json({ error: 'Notion API 키가 설정되지 않았습니다' }, { status: 503 })
  }

  let body: { documentId: string; notionPageId: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })
  }

  if (!body.documentId || !body.notionPageId?.trim()) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
  }

  const [doc] = await db
    .select({ title: documents.title, type: documents.type, content: documents.content, project_id: documents.project_id })
    .from(documents)
    .where(eq(documents.id, body.documentId))
    .limit(1)

  if (!doc) {
    return NextResponse.json({ error: '문서를 찾을 수 없습니다' }, { status: 404 })
  }

  if (!doc.content?.trim()) {
    return NextResponse.json({ error: '내보낼 내용이 없습니다' }, { status: 400 })
  }

  const [project] = await db
    .select({ title: projects.title })
    .from(projects)
    .where(and(eq(projects.id, doc.project_id), eq(projects.user_id, session.user.id)))
    .limit(1)

  const pageTitle = project ? `[${project.title}] ${doc.title}` : doc.title

  try {
    const notionPageId = await appendContentToPage(
      body.notionPageId.trim(),
      pageTitle,
      doc.content,
      doc.type
    )
    return NextResponse.json({ notionPageId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Notion 내보내기에 실패했습니다'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
