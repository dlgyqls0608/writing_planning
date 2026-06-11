'use client'

import { use, useEffect, useState } from 'react'
import { useProjectStore } from '@/stores/project'
import { AppHeader } from '@/components/layout/AppHeader'
import { ThreePanel } from '@/components/layout/ThreePanel'
import type { Project, Document } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

async function fetchProject(id: string): Promise<{ project: Project; documents: Document[] }> {
  const res = await fetch(`/api/projects/${id}`)
  if (!res.ok) throw new Error('프로젝트를 불러올 수 없습니다.')
  const data = await res.json()
  return { project: data, documents: data.documents ?? [] }
}

export default function ProjectPage({ params }: PageProps) {
  const { id } = use(params)
  const { setCurrentProject, setDocuments } = useProjectStore()
  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocs] = useState<Document[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showIdeaModal, setShowIdeaModal] = useState(false)

  useEffect(() => {
    fetchProject(id)
      .then(({ project, documents }) => {
        setProject(project)
        setDocs(documents)
        setCurrentProject(project)
        setDocuments(documents)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, setCurrentProject, setDocuments])

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="h-12 bg-white border-b border-gray-200 animate-pulse" />
        <div className="flex-1 flex">
          <div className="w-[260px] bg-gray-50 border-r border-gray-200 animate-pulse" />
          <div className="flex-1 bg-[#eef0f5] animate-pulse" />
          <div className="w-[280px] bg-gray-50 border-l border-gray-200 animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-600">{error ?? '프로젝트를 찾을 수 없습니다.'}</p>
          <a href="/" className="text-sm text-[#4f46e5] underline">대시보드로 돌아가기</a>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <AppHeader project={project} onNewIdea={() => setShowIdeaModal(true)} />
      <div className="flex-1 overflow-hidden">
        <ThreePanel project={project} />
      </div>
    </div>
  )
}
