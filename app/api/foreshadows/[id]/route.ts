import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { foreshadows, projects } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

type Params = Promise<{ id: string }>

async function getOwnedForeshadow(id: string, userId: string) {
  const [item] = await db
    .select({ id: foreshadows.id })
    .from(foreshadows)
    .innerJoin(projects, and(eq(projects.id, foreshadows.project_id), eq(projects.user_id, userId)))
    .where(eq(foreshadows.id, id))
    .limit(1)
  return item ?? null
}

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!await getOwnedForeshadow(id, session.user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()
  const allowed: Record<string, unknown> = {}
  if (typeof body.is_resolved === 'boolean') allowed.is_resolved = body.is_resolved
  if ('resolved_episode' in body) allowed.resolved_episode = body.resolved_episode ?? null
  if ('planted_episode' in body) allowed.planted_episode = body.planted_episode ?? null
  if (typeof body.content === 'string') allowed.content = body.content

  const [data] = await db
    .update(foreshadows)
    .set(allowed)
    .where(eq(foreshadows.id, id))
    .returning()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!await getOwnedForeshadow(id, session.user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.delete(foreshadows).where(eq(foreshadows.id, id))
  return new NextResponse(null, { status: 204 })
}
