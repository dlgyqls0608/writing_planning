'use client'

import { useRef, useState } from 'react'
import { ChevronDown, ChevronRight, FileText, BarChart2, BookOpen, Bookmark, AlignLeft, Plus, Loader2 } from 'lucide-react'
import { useProjectStore } from '@/stores/project'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Project, Document, DocumentType } from '@/types'

const DOC_META: Record<DocumentType, { label: string; icon: React.ElementType; variant: string }> = {
  logline: { label: '로그라인', icon: AlignLeft, variant: 'logline' },
  synopsis: { label: '시놉시스', icon: FileText, variant: 'synopsis' },
  plot: { label: '플롯', icon: BarChart2, variant: 'plot' },
  treatment: { label: '트리트먼트', icon: Bookmark, variant: 'treatment' },
  'story-bible': { label: '스토리 바이블', icon: BookOpen, variant: 'story-bible' },
}

const DOC_ORDER: DocumentType[] = ['logline', 'synopsis', 'plot', 'treatment', 'story-bible']

interface BinderProps {
  project: Project
}

export function Binder({ project }: BinderProps) {
  const { selectedDocumentId, selectDocument, addDocument, documents } = useProjectStore()
  const [treatmentOpen, setTreatmentOpen] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleAddTreatment() {
    const title = newTitle.trim()
    if (!title) return
    setIsCreating(true)
    setAddError(null)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id, type: 'treatment', title }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `서버 오류 (${res.status})`)
      }
      const doc: Document = await res.json()
      addDocument(doc)
      selectDocument(doc.id, 'treatment')
      setNewTitle('')
      setIsAdding(false)
    } catch (e) {
      setAddError(e instanceof Error ? e.message : '추가에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsCreating(false)
    }
  }

  function startAdding() {
    setIsAdding(true)
    setNewTitle('')
    setAddError(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const getDoc = (type: DocumentType) => documents.find((d) => d.type === type)

  const treatmentDocs = documents
    .filter((d) => d.type === 'treatment')
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
          {project.title}
        </p>
      </div>

      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {DOC_ORDER.map((type) => {
          const meta = DOC_META[type]
          const doc = getDoc(type)
          const Icon = meta.icon
          const isSelected = doc ? selectedDocumentId === doc.id : false
          const isTreatment = type === 'treatment'

          if (isTreatment) {
            return (
              <div key={type}>
                <button
                  onClick={() => setTreatmentOpen((v) => !v)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors',
                    'hover:bg-gray-100 text-gray-700'
                  )}
                >
                  {treatmentOpen ? (
                    <ChevronDown className="size-3.5 shrink-0 text-gray-400" />
                  ) : (
                    <ChevronRight className="size-3.5 shrink-0 text-gray-400" />
                  )}
                  <Icon className="size-4 shrink-0 text-[#d97706]" />
                  <span className="flex-1 truncate font-medium">{meta.label}</span>
                </button>
                {treatmentOpen && (
                  <div className="ml-6 mt-0.5 space-y-0.5">
                    {treatmentDocs.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => selectDocument(d.id, 'treatment')}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors',
                          selectedDocumentId === d.id
                            ? 'bg-[#fef3c7] text-[#d97706] font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        <FileText className="size-3.5 shrink-0" />
                        <span className="truncate">{d.title}</span>
                        {d.status === 'generated' && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#d97706] shrink-0" />
                        )}
                      </button>
                    ))}
                    {isAdding ? (
                      <div className="px-2 py-1 space-y-1">
                        <div className="flex items-center gap-1">
                          <input
                            ref={inputRef}
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddTreatment()
                              if (e.key === 'Escape') { setIsAdding(false); setNewTitle(''); setAddError(null) }
                            }}
                            placeholder="예: 1화, 11~20화"
                            className="flex-1 min-w-0 text-xs border border-[#4f46e5] rounded px-1.5 py-1 outline-none"
                            disabled={isCreating}
                          />
                          <button
                            onClick={handleAddTreatment}
                            disabled={!newTitle.trim() || isCreating}
                            className="shrink-0 p-1 rounded text-[#4f46e5] hover:bg-[#4f46e5]/10 disabled:opacity-40 transition-colors"
                          >
                            {isCreating ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                          </button>
                        </div>
                        {addError && (
                          <p className="text-[10px] text-red-500 leading-tight">{addError}</p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={startAdding}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="size-3.5 shrink-0" />
                        <span>회차 추가</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          }

          return (
            <button
              key={type}
              onClick={() => doc && selectDocument(doc.id, type)}
              disabled={!doc}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors',
                isSelected
                  ? `bg-[var(--c-${meta.variant}-tint,#f3f4f6)] text-gray-900 font-medium`
                  : 'text-gray-700 hover:bg-gray-100',
                !doc && 'opacity-40 cursor-default'
              )}
            >
              <Icon
                className="size-4 shrink-0"
                style={{ color: `var(--c-${meta.variant}, #6b7280)` }}
              />
              <span className="flex-1 truncate">{meta.label}</span>
              {doc?.status === 'generated' && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: `var(--c-${meta.variant}, #6b7280)` }}
                />
              )}
              {!doc && (
                <Badge variant="default" className="text-[10px] h-4">빈칸</Badge>
              )}
            </button>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          목표: {project.target_episodes}화 · {project.genre}
        </p>
      </div>
    </div>
  )
}
