import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects, documents } from '@/lib/db/schema'
import { and, eq, desc, inArray } from 'drizzle-orm'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await db
    .select()
    .from(projects)
    .where(eq(projects.user_id, session.user.id))
    .orderBy(desc(projects.updated_at))

  if (!data.length) return NextResponse.json([])

  const projectIds = data.map((p) => p.id)
  const loglineDocs = await db
    .select({ project_id: documents.project_id, content: documents.content })
    .from(documents)
    .where(and(inArray(documents.project_id, projectIds), eq(documents.type, 'logline')))

  const loglineMap = Object.fromEntries(
    loglineDocs.map((d) => [d.project_id, d.content])
  )

  return NextResponse.json(
    data.map((p) => ({ ...p, logline: loglineMap[p.id] ?? p.logline ?? null }))
  )
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, genre, target_episodes = 100 } = body

  if (!title || !genre) {
    return NextResponse.json({ error: '제목과 장르는 필수입니다.' }, { status: 400 })
  }

  const [project] = await db
    .insert(projects)
    .values({ user_id: session.user.id, title, genre, target_episodes })
    .returning()

  await db.insert(documents).values([
    { project_id: project.id, type: 'logline',     title: '로그라인' },
    { project_id: project.id, type: 'synopsis',    title: '시놉시스' },
    { project_id: project.id, type: 'plot',        title: '플롯' },
    { project_id: project.id, type: 'treatment',   title: '트리트먼트' },
    { project_id: project.id, type: 'story-bible', title: '스토리 바이블' },
  ])

  return NextResponse.json(project, { status: 201 })
}
