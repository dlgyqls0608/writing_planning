import { NextResponse } from 'next/server'

// Better Auth handles auth callbacks internally at /api/auth/*
// This route is kept for backwards compatibility redirects only
export function GET() {
  return NextResponse.redirect(new URL('/', process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'))
}
