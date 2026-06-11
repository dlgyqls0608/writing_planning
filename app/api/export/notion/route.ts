import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { appendContentToPage } from '@/lib/notion/client'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

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

  // Fetch the document (RLS ensures it belongs to the user's project)
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('title, type, content, project_id')
    .eq('id', body.documentId)
    .single()

  if (docError || !doc) {
    return NextResponse.json({ error: '문서를 찾을 수 없습니다' }, { status: 404 })
  }

  if (!doc.content?.trim()) {
    return NextResponse.json({ error: '내보낼 내용이 없습니다' }, { status: 400 })
  }

  // Fetch project title for the Notion page title
  const { data: project } = await supabase
    .from('projects')
    .select('title')
    .eq('id', doc.project_id)
    .eq('user_id', user.id)
    .single()

  const pageTitle = project
    ? `[${project.title}] ${doc.title}`
    : doc.title

  try {
    const notionPageId = await appendContentToPage(
      body.notionPageId.trim(),
      pageTitle,
      doc.content
    )

    return NextResponse.json({ notionPageId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Notion 내보내기에 실패했습니다'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
