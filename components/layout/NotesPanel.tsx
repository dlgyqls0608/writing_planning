'use client'

import { useState } from 'react'
import { Plus, Bookmark, Trash2, ChevronDown, ChevronUp, CheckSquare } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SuccessChecklist } from '@/components/checklist/SuccessChecklist'
import type { Foreshadow } from '@/types'

interface NotesPanelProps {
  projectId: string
  genre: string
}

interface Note {
  id: string
  text: string
}

async function fetchForeshadows(projectId: string): Promise<Foreshadow[]> {
  const res = await fetch(`/api/foreshadows?projectId=${projectId}`)
  if (!res.ok) return []
  return res.json()
}

async function createForeshadow(data: { project_id: string; content: string }) {
  const res = await fetch('/api/foreshadows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('복선 저장 실패')
  return res.json()
}

async function toggleForeshadow(id: string, is_resolved: boolean) {
  const res = await fetch(`/api/foreshadows/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_resolved }),
  })
  if (!res.ok) throw new Error('복선 업데이트 실패')
  return res.json()
}

async function deleteForeshadow(id: string) {
  const res = await fetch(`/api/foreshadows/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('복선 삭제 실패')
}

export function NotesPanel({ projectId, genre }: NotesPanelProps) {
  const qc = useQueryClient()
  const [notes, setNotes] = useState<Note[]>([])
  const [noteInput, setNoteInput] = useState('')
  const [foreshadowInput, setForeshadowInput] = useState('')
  const [checklistOpen, setChecklistOpen] = useState(false)

  const { data: foreshadows = [] } = useQuery({
    queryKey: ['foreshadows', projectId],
    queryFn: () => fetchForeshadows(projectId),
  })

  const addMutation = useMutation({
    mutationFn: createForeshadow,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['foreshadows', projectId] })
      setForeshadowInput('')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_resolved }: { id: string; is_resolved: boolean }) =>
      toggleForeshadow(id, is_resolved),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foreshadows', projectId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteForeshadow,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foreshadows', projectId] }),
  })

  function addNote() {
    if (!noteInput.trim()) return
    setNotes((prev) => [...prev, { id: crypto.randomUUID(), text: noteInput.trim() }])
    setNoteInput('')
  }

  function addForeshadow() {
    if (!foreshadowInput.trim()) return
    addMutation.mutate({ project_id: projectId, content: foreshadowInput.trim() })
  }

  return (
    <div className="flex flex-col h-full divide-y divide-gray-100">
      {/* 작가 메모 */}
      <section className="p-3 flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <span>📌</span> 작가 메모
        </h3>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {notes.map((n) => (
            <p key={n.id} className="text-xs text-gray-700 bg-gray-50 rounded px-2 py-1.5">
              {n.text}
            </p>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-gray-400"
            placeholder="메모 입력..."
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNote()}
          />
          <button onClick={addNote} className="p-1 rounded hover:bg-gray-100 text-gray-500">
            <Plus className="size-4" />
          </button>
        </div>
      </section>

      {/* 복선 트래커 */}
      <section className="p-3 flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 text-[#dc2626]">
          <Bookmark className="size-3" />
          복선 트래커
        </h3>
        <div className="space-y-1.5 max-h-52 overflow-y-auto">
          {foreshadows.map((f) => (
            <div
              key={f.id}
              className="flex items-start gap-1.5 bg-[#fee2e2] rounded px-2 py-1.5 group"
            >
              <input
                type="checkbox"
                checked={f.is_resolved}
                onChange={() =>
                  toggleMutation.mutate({ id: f.id, is_resolved: !f.is_resolved })
                }
                className="mt-0.5 shrink-0 accent-[#dc2626]"
              />
              <span
                className={`flex-1 text-xs text-[#7f1d1d] leading-snug ${
                  f.is_resolved ? 'line-through opacity-60' : ''
                }`}
              >
                {f.content}
              </span>
              <button
                onClick={() => deleteMutation.mutate(f.id)}
                className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded hover:bg-red-200 text-[#dc2626] transition-opacity"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
          {foreshadows.length === 0 && (
            <p className="text-[10px] text-gray-400 italic">등록된 복선이 없습니다.</p>
          )}
        </div>
        <div className="flex gap-1">
          <input
            className="flex-1 text-xs border border-red-100 rounded px-2 py-1 outline-none focus:border-red-300"
            placeholder="복선 추가..."
            value={foreshadowInput}
            onChange={(e) => setForeshadowInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addForeshadow()}
            disabled={addMutation.isPending}
          />
          <button
            onClick={addForeshadow}
            disabled={addMutation.isPending}
            className="p-1 rounded hover:bg-red-50 text-[#dc2626] disabled:opacity-50"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </section>

      {/* 성공 패턴 체크리스트 */}
      <section className="p-3 flex flex-col gap-2">
        <button
          onClick={() => setChecklistOpen((o) => !o)}
          className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <CheckSquare className="size-3 text-[#4f46e5]" />
            <span className="text-[#4f46e5]">성공 패턴 체크</span>
          </span>
          {checklistOpen ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
        </button>
        {checklistOpen && <SuccessChecklist genre={genre} />}
      </section>
    </div>
  )
}
