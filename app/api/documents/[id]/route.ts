import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { documents, document_versions } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

type Params = Promise<{ id: string }>

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const [current] = await db
    .select({ content: documents.content, user_input: documents.user_input })
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1)

  if (current?.content) {
    const [lastVer] = await db
      .select({ version_number: document_versions.version_number })
      .from(document_versions)
      .where(eq(document_versions.document_id, id))
      .orderBy(desc(document_versions.version_number))
      .limit(1)

    await db.insert(document_versions).values({
      document_id:    id,
      version_number: (lastVer?.version_number ?? 0) + 1,
      content:        current.content,
      user_input:     current.user_input ?? '',
    })
  }

  const [data] = await db
    .update(documents)
    .set({ ...body, updated_at: new Date() })
    .where(eq(documents.id, id))
    .returning()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const [data] = await db
    .update(documents)
    .set({ ...body, updated_at: new Date() })
    .where(eq(documents.id, id))
    .returning()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.delete(documents).where(eq(documents.id, id))
  return new NextResponse(null, { status: 204 })
}
