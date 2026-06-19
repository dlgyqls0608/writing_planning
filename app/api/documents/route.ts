import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { documents, projects } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id, type, title } = await request.json()

  if (!project_id || !type || !title) {
    return NextResponse.json({ error: 'project_id, type, title 필수' }, { status: 400 })
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, project_id), eq(projects.user_id, session.user.id)))
    .limit(1)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [data] = await db
    .insert(documents)
    .values({ project_id, type, title, user_input: '', content: '', status: 'empty' })
    .returning()

  return NextResponse.json(data, { status: 201 })
}
