'use client'

import { useEffect, useState } from 'react'
import { Plus, Bookmark, Trash2, ChevronDown, ChevronUp, CheckSquare, Users } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SuccessChecklist } from '@/components/checklist/SuccessChecklist'
import type { Character, Foreshadow } from '@/types'

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

async function createForeshadow(data: {
  project_id: string
  content: string
  planted_episode?: number
  resolved_episode?: number
}) {
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

async function fetchCharacters(projectId: string): Promise<Character[]> {
  const res = await fetch(`/api/characters?projectId=${projectId}`)
  if (!res.ok) return []
  return res.json()
}

async function createCharacter(data: {
  project_id: string; name: string; role: string; description: string
}) {
  const res = await fetch('/api/characters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('인물 저장 실패')
  return res.json()
}

async function deleteCharacter(id: string) {
  await fetch(`/api/characters/${id}`, { method: 'DELETE' })
}

export function NotesPanel({ projectId, genre }: NotesPanelProps) {
  const qc = useQueryClient()
  const storageKey = `notes-${projectId}`

  const [notes, setNotes] = useState<Note[]>([])
  const [noteInput, setNoteInput] = useState('')

  const [foreshadowInput, setForeshadowInput] = useState('')
  const [plantedEp, setPlantedEp] = useState('')
  const [resolvedEp, setResolvedEp] = useState('')
  const [showForeshadowDetail, setShowForeshadowDetail] = useState(false)

  const [checklistOpen, setChecklistOpen] = useState(false)
  const [charactersOpen, setCharactersOpen] = useState(false)
  const [charName, setCharName] = useState('')
  const [charRole, setCharRole] = useState<'protagonist' | 'antagonist' | 'supporting'>('supporting')
  const [charDesc, setCharDesc] = useState('')
  const [showCharForm, setShowCharForm] = useState(false)

  // localStorage에서 메모 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setNotes(JSON.parse(saved))
    } catch {}
  }, [storageKey])

  // 메모 변경 시 localStorage 저장
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes))
    } catch {}
  }, [notes, storageKey])

  const { data: foreshadows = [] } = useQuery({
    queryKey: ['foreshadows', projectId],
    queryFn: () => fetchForeshadows(projectId),
  })

  const addMutation = useMutation({
    mutationFn: createForeshadow,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['foreshadows', projectId] })
      setForeshadowInput('')
      setPlantedEp('')
      setResolvedEp('')
      setShowForeshadowDetail(false)
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

  const { data: characters = [] } = useQuery({
    queryKey: ['characters', projectId],
    queryFn: () => fetchCharacters(projectId),
    enabled: charactersOpen,
  })

  const addCharMutation = useMutation({
    mutationFn: createCharacter,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['characters', projectId] })
      setCharName(''); setCharDesc(''); setShowCharForm(false)
    },
  })

  const deleteCharMutation = useMutation({
    mutationFn: deleteCharacter,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['characters', projectId] }),
  })

  function addNote() {
    if (!noteInput.trim()) return
    setNotes((prev) => [...prev, { id: crypto.randomUUID(), text: noteInput.trim() }])
    setNoteInput('')
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  function addForeshadow() {
    if (!foreshadowInput.trim()) return
    addMutation.mutate({
      project_id: projectId,
      content: foreshadowInput.trim(),
      planted_episode: plantedEp ? Number(plantedEp) : undefined,
      resolved_episode: resolvedEp ? Number(resolvedEp) : undefined,
    })
  }

  return (
    <div className="flex flex-col h-full divide-y divide-gray-100">
      {/* 작가 메모 */}
      <section className="p-3 flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <span>📌</span> 작가 메모
        </h3>
        <div className="space-y-1.5 max-h-36 overflow-y-auto">
          {notes.map((n) => (
            <div key={n.id} className="flex items-start gap-1 group">
              <p className="flex-1 text-xs text-gray-700 bg-gray-50 rounded px-2 py-1.5">
                {n.text}
              </p>
              <button
                onClick={() => deleteNote(n.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 text-gray-400 transition-opacity mt-0.5"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
          {notes.length === 0 && (
            <p className="text-[10px] text-gray-400 italic">등록된 메모가 없습니다.</p>
          )}
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
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
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
              <div className="flex-1 min-w-0">
                <span
                  className={`text-xs text-[#7f1d1d] leading-snug block ${
                    f.is_resolved ? 'line-through opacity-60' : ''
                  }`}
                >
                  {f.content}
                </span>
                {(f.planted_episode || f.resolved_episode) && (
                  <span className="text-[10px] text-[#dc2626]/70 mt-0.5 block">
                    {f.planted_episode ? `${f.planted_episode}화 심기` : ''}
                    {f.planted_episode && f.resolved_episode ? ' → ' : ''}
                    {f.resolved_episode ? `${f.resolved_episode}화 회수` : ''}
                  </span>
                )}
              </div>
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

        {/* 복선 입력 */}
        <div className="space-y-1.5">
          <div className="flex gap-1">
            <input
              className="flex-1 text-xs border border-red-100 rounded px-2 py-1 outline-none focus:border-red-300"
              placeholder="복선 내용..."
              value={foreshadowInput}
              onChange={(e) => setForeshadowInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !showForeshadowDetail) addForeshadow()
              }}
              disabled={addMutation.isPending}
            />
            <button
              onClick={() => setShowForeshadowDetail((v) => !v)}
              className="px-1.5 rounded text-[10px] border border-red-100 text-[#dc2626] hover:bg-red-50 transition-colors"
              title="회차 번호 설정"
            >
              {showForeshadowDetail ? '▲' : '화수'}
            </button>
            <button
              onClick={addForeshadow}
              disabled={addMutation.isPending}
              className="p-1 rounded hover:bg-red-50 text-[#dc2626] disabled:opacity-50"
            >
              <Plus className="size-4" />
            </button>
          </div>
          {showForeshadowDetail && (
            <div className="flex gap-1.5">
              <input
                type="number"
                className="w-1/2 text-xs border border-red-100 rounded px-2 py-1 outline-none focus:border-red-300"
                placeholder="심기 화수"
                value={plantedEp}
                onChange={(e) => setPlantedEp(e.target.value)}
                min={1}
              />
              <input
                type="number"
                className="w-1/2 text-xs border border-red-100 rounded px-2 py-1 outline-none focus:border-red-300"
                placeholder="회수 화수"
                value={resolvedEp}
                onChange={(e) => setResolvedEp(e.target.value)}
                min={1}
              />
            </div>
          )}
        </div>
      </section>

      {/* 인물 관리 */}
      <section className="p-3 flex flex-col gap-2">
        <button
          onClick={() => setCharactersOpen((o) => !o)}
          className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Users className="size-3 text-[#0891b2]" />
            <span className="text-[#0891b2]">인물 관리</span>
          </span>
          {charactersOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>

        {charactersOpen && (
          <div className="space-y-2">
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {characters.map((c) => (
                <div key={c.id} className="flex items-start gap-1.5 bg-[#e0f2fe] rounded px-2 py-1.5 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#0c4a6e] truncate">{c.name}</span>
                      <span className="text-[10px] text-[#0891b2] shrink-0">
                        {c.role === 'protagonist' ? '주인공' : c.role === 'antagonist' ? '빌런' : '조연'}
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-[10px] text-[#075985] mt-0.5 leading-snug line-clamp-2">{c.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteCharMutation.mutate(c.id)}
                    className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded hover:bg-blue-200 text-[#0891b2] transition-opacity"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
              {characters.length === 0 && (
                <p className="text-[10px] text-gray-400 italic">등록된 인물이 없습니다.</p>
              )}
            </div>

            {showCharForm ? (
              <div className="space-y-1.5 border border-blue-100 rounded-lg p-2">
                <input
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#0891b2]"
                  placeholder="인물 이름 *"
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                />
                <select
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#0891b2]"
                  value={charRole}
                  onChange={(e) => setCharRole(e.target.value as typeof charRole)}
                >
                  <option value="protagonist">주인공</option>
                  <option value="antagonist">빌런/적대자</option>
                  <option value="supporting">조연</option>
                </select>
                <textarea
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#0891b2] resize-none"
                  placeholder="인물 설명 (선택)"
                  rows={2}
                  value={charDesc}
                  onChange={(e) => setCharDesc(e.target.value)}
                />
                <div className="flex gap-1 justify-end">
                  <button
                    onClick={() => { setShowCharForm(false); setCharName(''); setCharDesc('') }}
                    className="text-xs px-2 py-1 rounded text-gray-500 hover:bg-gray-100"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      if (!charName.trim()) return
                      addCharMutation.mutate({ project_id: projectId, name: charName.trim(), role: charRole, description: charDesc.trim() })
                    }}
                    disabled={!charName.trim() || addCharMutation.isPending}
                    className="text-xs px-2 py-1 rounded bg-[#0891b2] text-white disabled:opacity-50"
                  >
                    추가
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCharForm(true)}
                className="w-full flex items-center gap-1.5 text-xs text-[#0891b2] hover:bg-blue-50 rounded px-2 py-1.5 transition-colors"
              >
                <Plus className="size-3.5" />
                인물 추가
              </button>
            )}
          </div>
        )}
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
