import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id, type, title } = await request.json()

  const [data] = await db
    .insert(documents)
    .values({ project_id, type, title, user_input: '', content: '', status: 'empty' })
    .returning()

  return NextResponse.json(data, { status: 201 })
}
