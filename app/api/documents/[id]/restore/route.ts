import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { versionId } = await request.json()
  if (!versionId) return NextResponse.json({ error: 'versionId required' }, { status: 400 })

  const { data: version, error: verErr } = await supabase
    .from('document_versions')
    .select('content, user_input')
    .eq('id', versionId)
    .eq('document_id', id)
    .single()

  if (verErr || !version) return NextResponse.json({ error: '버전을 찾을 수 없습니다' }, { status: 404 })

  // 현재 내용을 먼저 새 버전으로 백업
  const { data: current } = await supabase
    .from('documents')
    .select('content, user_input')
    .eq('id', id)
    .single()

  if (current?.content) {
    const { data: lastVer } = await supabase
      .from('document_versions')
      .select('version_number')
      .eq('document_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    await supabase.from('document_versions').insert({
      document_id: id,
      version_number: (lastVer?.version_number ?? 0) + 1,
      content: current.content,
      user_input: current.user_input ?? '',
    })
  }

  // 선택한 버전으로 복원
  const { data, error } = await supabase
    .from('documents')
    .update({
      content: version.content,
      user_input: version.user_input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
