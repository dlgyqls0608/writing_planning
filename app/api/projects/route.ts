import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, genre, target_episodes = 100 } = body

  if (!title || !genre) {
    return NextResponse.json({ error: '제목과 장르는 필수입니다.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: user.id, title, genre, target_episodes })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const defaultDocs = [
    { type: 'logline',      title: '로그라인' },
    { type: 'synopsis',     title: '시놉시스' },
    { type: 'plot',         title: '플롯' },
    { type: 'treatment',    title: '트리트먼트' },
    { type: 'story-bible',  title: '스토리 바이블' },
  ].map((d) => ({ ...d, project_id: data.id }))

  await supabase.from('documents').insert(defaultDocs)

  return NextResponse.json(data, { status: 201 })
}
