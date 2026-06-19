import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { characters, projects } from '@/lib/db/schema'
import { and, eq, asc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.user_id, session.user.id)))
    .limit(1)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data = await db
    .select()
    .from(characters)
    .where(eq(characters.project_id, projectId))
    .orderBy(asc(characters.created_at))

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { project_id, name, role, description, memo } = body

  if (!project_id || !name || !role) {
    return NextResponse.json({ error: 'project_id, name, role 필수' }, { status: 400 })
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, project_id), eq(projects.user_id, session.user.id)))
    .limit(1)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [data] = await db
    .insert(characters)
    .values({ project_id, name, role, description: description ?? '', memo: memo ?? '' })
    .returning()

  return NextResponse.json(data, { status: 201 })
}
