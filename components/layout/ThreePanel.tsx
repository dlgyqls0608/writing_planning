'use client'

import { useProjectStore } from '@/stores/project'
import { Binder } from './Binder'
import { Editor } from './Editor'
import { NotesPanel } from './NotesPanel'
import type { Project, Document } from '@/types'

interface ThreePanelProps {
  project: Project
  documents: Document[]
}

export function ThreePanel({ project, documents }: ThreePanelProps) {
  const { isBinderOpen, isNotesOpen } = useProjectStore()

  return (
    <div className="flex h-full overflow-hidden">
      {isBinderOpen && (
        <aside className="w-[260px] shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
          <Binder project={project} documents={documents} />
        </aside>
      )}

      <main className="flex-1 overflow-hidden bg-[#eef0f5]">
        <Editor project={project} />
      </main>

      {isNotesOpen && (
        <aside className="w-[280px] shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
          <NotesPanel projectId={project.id} genre={project.genre} />
        </aside>
      )}
    </div>
  )
}
