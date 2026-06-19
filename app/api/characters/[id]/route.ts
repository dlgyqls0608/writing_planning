import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { characters, projects } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

type Params = Promise<{ id: string }>

async function getOwnedCharacter(id: string, userId: string) {
  const [char] = await db
    .select({ id: characters.id })
    .from(characters)
    .innerJoin(projects, and(eq(projects.id, characters.project_id), eq(projects.user_id, userId)))
    .where(eq(characters.id, id))
    .limit(1)
  return char ?? null
}

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!await getOwnedCharacter(id, session.user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()
  const allowed: Record<string, unknown> = {}
  if (typeof body.is_deceased === 'boolean') allowed.is_deceased = body.is_deceased
  if (typeof body.name === 'string') allowed.name = body.name
  if (typeof body.description === 'string') allowed.description = body.description
  if (typeof body.memo === 'string') allowed.memo = body.memo
  if (typeof body.role === 'string' && body.role.trim()) allowed.role = body.role.trim()
  if (body.deceased_episode === null || typeof body.deceased_episode === 'number') {
    allowed.deceased_episode = body.deceased_episode
  }

  const [data] = await db
    .update(characters)
    .set(allowed)
    .where(eq(characters.id, id))
    .returning()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!await getOwnedCharacter(id, session.user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.delete(characters).where(eq(characters.id, id))
  return new NextResponse(null, { status: 204 })
}
