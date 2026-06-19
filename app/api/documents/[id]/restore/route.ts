import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { documents, document_versions, projects } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'

type Params = Promise<{ id: string }>

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [doc] = await db
    .select({ id: documents.id, content: documents.content, user_input: documents.user_input })
    .from(documents)
    .innerJoin(projects, and(eq(projects.id, documents.project_id), eq(projects.user_id, session.user.id)))
    .where(eq(documents.id, id))
    .limit(1)
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { versionId } = await request.json()
  if (!versionId) return NextResponse.json({ error: 'versionId required' }, { status: 400 })

  const [version] = await db
    .select({ content: document_versions.content, user_input: document_versions.user_input })
    .from(document_versions)
    .where(and(eq(document_versions.id, versionId), eq(document_versions.document_id, id)))
    .limit(1)

  if (!version) return NextResponse.json({ error: '버전을 찾을 수 없습니다' }, { status: 404 })

  if (doc.content) {
    const [lastVer] = await db
      .select({ version_number: document_versions.version_number })
      .from(document_versions)
      .where(eq(document_versions.document_id, id))
      .orderBy(desc(document_versions.version_number))
      .limit(1)

    await db.insert(document_versions).values({
      document_id:    id,
      version_number: (lastVer?.version_number ?? 0) + 1,
      content:        doc.content,
      user_input:     doc.user_input ?? '',
    })
  }

  const [data] = await db
    .update(documents)
    .set({ content: version.content, user_input: version.user_input, updated_at: new Date() })
    .where(eq(documents.id, id))
    .returning()

  return NextResponse.json(data)
}
