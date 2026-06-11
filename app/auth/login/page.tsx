'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/'

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace(next)
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) throw error
        setMessage('확인 이메일을 발송했습니다. 받은편지함을 확인해주세요.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#eef0f5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        {/* 로고 */}
        <div className="flex items-center justify-center gap-2">
          <BookOpen className="size-6 text-[#4f46e5]" />
          <span className="font-bold text-xl text-[#4f46e5]">NovelForge</span>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-lg font-bold text-gray-900">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h1>
          <p className="text-sm text-gray-500">웹소설 기획 도우미</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              required
              autoComplete="email"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
              placeholder="6자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#4f46e5] text-white text-sm font-medium rounded-lg hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          {mode === 'login' ? (
            <>
              계정이 없으신가요?{' '}
              <button
                onClick={() => { setMode('signup'); setError(null); setMessage(null) }}
                className="text-[#4f46e5] font-medium hover:underline"
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{' '}
              <button
                onClick={() => { setMode('login'); setError(null); setMessage(null) }}
                className="text-[#4f46e5] font-medium hover:underline"
              >
                로그인
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
