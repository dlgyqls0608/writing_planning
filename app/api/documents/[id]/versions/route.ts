import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { document_versions } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

type Params = Promise<{ id: string }>

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await db
    .select()
    .from(document_versions)
    .where(eq(document_versions.document_id, id))
    .orderBy(desc(document_versions.version_number))

  return NextResponse.json(data ?? [])
}
