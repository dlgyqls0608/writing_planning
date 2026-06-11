'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { BookOpen, Plus, Trash2, FolderOpen, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import type { Project } from '@/types'

const GENRE_OPTIONS = ['현대물', '판타지', '로맨스', '로맨스판타지', '무협', '헌터물', 'SF', '기타']
const STATUS_LABEL: Record<string, string> = {
  empty: '시작 전',
  draft: '작성중',
  generated: '생성됨',
  finalized: '완성',
}

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects')
  if (!res.ok) throw new Error('프로젝트 목록을 불러올 수 없습니다.')
  return res.json()
}

async function createProject(data: { title: string; genre: string; target_episodes: number }): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('프로젝트 생성에 실패했습니다.')
  return res.json()
}

async function deleteProject(id: string) {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('삭제에 실패했습니다.')
}

export default function DashboardPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', genre: '현대물', target_episodes: 100 })

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      setShowForm(false)
      setForm({ title: '', genre: '현대물', target_episodes: 100 })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    createMutation.mutate(form)
  }

  return (
    <div className="min-h-full">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-[#4f46e5]" />
            <span className="font-bold text-lg text-[#4f46e5]">NovelForge</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-[#4338ca] transition-colors"
          >
            <Plus className="size-4" />
            새 작품 시작
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">내 작품</h1>

        {/* 새 작품 폼 */}
        {showForm && (
          <div className="mb-6 bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">새 작품 정보 입력</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">작품 제목 *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                  placeholder="예: 재벌 비서 회귀"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">장르 *</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4f46e5]"
                    value={form.genre}
                    onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
                  >
                    {GENRE_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">목표 화수</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4f46e5]"
                    value={form.target_episodes}
                    onChange={(e) => setForm((f) => ({ ...f, target_episodes: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending ? '생성 중...' : '작품 만들기'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 오류 */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {(error as Error).message}
          </div>
        )}

        {/* 로딩 */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* 프로젝트 목록 */}
        {!isLoading && projects.length === 0 && !showForm && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📁</div>
            <h2 className="text-lg font-semibold text-gray-600 mb-2">아직 작품이 없어요</h2>
            <p className="text-sm text-gray-400 mb-6">새 작품 시작 버튼으로 첫 번째 기획 문서를 만들어보세요.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4f46e5] text-white rounded-lg text-sm font-medium hover:bg-[#4338ca] transition-colors"
            >
              <Plus className="size-4" />
              새 작품 시작
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="group hover:ring-2 hover:ring-[#4f46e5]/30 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{project.title}</CardTitle>
                  <Badge variant="default" className="shrink-0 text-[10px]">
                    {project.genre}
                  </Badge>
                </div>
                <CardDescription>
                  목표 {project.target_episodes}화
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-gray-400">
                {project.logline ? (
                  <p className="line-clamp-2 text-gray-600">{project.logline}</p>
                ) : (
                  <p className="italic">로그라인 미작성</p>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-gray-400">
                  {new Date(project.updated_at).toLocaleDateString('ko-KR')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      if (confirm(`"${project.title}" 작품을 삭제할까요?`)) {
                        deleteMutation.mutate(project.id)
                      }
                    }}
                    className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#4f46e5] text-white text-xs font-medium hover:bg-[#4338ca] transition-colors"
                  >
                    <FolderOpen className="size-3.5" />
                    열기
                    <ChevronRight className="size-3" />
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
