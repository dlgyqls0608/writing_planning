import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { foreshadows, projects } from '@/lib/db/schema'
import { and, eq, asc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.user_id, session.user.id)))
    .limit(1)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data = await db
    .select()
    .from(foreshadows)
    .where(eq(foreshadows.project_id, projectId))
    .orderBy(asc(foreshadows.created_at))

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (!body.project_id || !body.content) {
    return NextResponse.json({ error: 'project_id, content 필수' }, { status: 400 })
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, body.project_id), eq(projects.user_id, session.user.id)))
    .limit(1)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [data] = await db
    .insert(foreshadows)
    .values({
      project_id:       body.project_id,
      content:          body.content,
      is_resolved:      false,
      planted_episode:  body.planted_episode ?? null,
      resolved_episode: body.resolved_episode ?? null,
    })
    .returning()

  return NextResponse.json(data, { status: 201 })
}
