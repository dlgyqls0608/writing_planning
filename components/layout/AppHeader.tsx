'use client'

import Link from 'next/link'
import { PanelLeft, PanelRight, BookOpen } from 'lucide-react'
import { useProjectStore } from '@/stores/project'
import type { Project } from '@/types'

interface AppHeaderProps {
  project?: Project
}

export function AppHeader({ project }: AppHeaderProps) {
  const { toggleBinder, toggleNotes } = useProjectStore()

  return (
    <header className="h-12 shrink-0 flex items-center border-b border-gray-200 bg-white px-4 gap-3">
      <Link href="/" className="flex items-center gap-2 font-bold text-[#4f46e5] text-sm">
        <BookOpen className="size-4" />
        NovelForge
      </Link>

      {project && (
        <>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 truncate max-w-[200px]">{project.title}</span>
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        {project && (
          <>
            <button
              onClick={toggleBinder}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
              title="바인더 토글"
            >
              <PanelLeft className="size-4" />
            </button>
            <button
              onClick={toggleNotes}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
              title="메모 패널 토글"
            >
              <PanelRight className="size-4" />
            </button>
          </>
        )}
      </div>
    </header>
  )
}
