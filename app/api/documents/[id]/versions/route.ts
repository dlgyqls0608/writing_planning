import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { document_versions, documents, projects } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'

type Params = Promise<{ id: string }>

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [doc] = await db
    .select({ id: documents.id })
    .from(documents)
    .innerJoin(projects, and(eq(projects.id, documents.project_id), eq(projects.user_id, session.user.id)))
    .where(eq(documents.id, id))
    .limit(1)
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data = await db
    .select()
    .from(document_versions)
    .where(eq(document_versions.document_id, id))
    .orderBy(desc(document_versions.version_number))

  return NextResponse.json(data ?? [])
}
