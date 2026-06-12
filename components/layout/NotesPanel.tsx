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

async function toggleForeshadow(id: string, is_resolved: boolean, resolved_episode?: number) {
  const body: Record<string, unknown> = { is_resolved }
  if (resolved_episode !== undefined) body.resolved_episode = resolved_episode
  const res = await fetch(`/api/foreshadows/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

async function toggleCharacterDeath(id: string, is_deceased: boolean) {
  const res = await fetch(`/api/characters/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_deceased }),
  })
  if (!res.ok) throw new Error('사망 상태 업데이트 실패')
  return res.json()
}

export function NotesPanel({ projectId, genre }: NotesPanelProps) {
  const qc = useQueryClient()
  const storageKey = `notes-${projectId}`

  const [notes, setNotes] = useState<Note[]>([])
  const [noteInput, setNoteInput] = useState('')

  const [foreshadowInput, setForeshadowInput] = useState('')
  const [plantedEp, setPlantedEp] = useState('')
  const [resolvedEp, setResolvedEp] = useState('')
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolvingEp, setResolvingEp] = useState('')

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
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_resolved, resolved_episode }: { id: string; is_resolved: boolean; resolved_episode?: number }) =>
      toggleForeshadow(id, is_resolved, resolved_episode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['foreshadows', projectId] })
      setResolvingId(null)
      setResolvingEp('')
    },
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

  const toggleDeathMutation = useMutation({
    mutationFn: ({ id, is_deceased }: { id: string; is_deceased: boolean }) =>
      toggleCharacterDeath(id, is_deceased),
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
          복선 목록
        </h3>

        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
          {foreshadows.map((f) => (
            <div
              key={f.id}
              className="rounded-lg border border-red-100 bg-[#fff8f8] px-2 py-2 group"
            >
              <div className="flex items-start gap-1.5">
                <div className={`mt-1 size-2 rounded-full shrink-0 ${f.is_resolved ? 'bg-green-500' : 'bg-orange-400'}`} />
                <div className="flex-1 min-w-0">
                  <span className={`text-xs leading-snug block ${f.is_resolved ? 'line-through text-gray-400' : 'text-[#7f1d1d]'}`}>
                    {f.content}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    {f.planted_episode ? `${f.planted_episode}화 등장` : '화수 미입력'}
                    {f.resolved_episode
                      ? ` → ${f.resolved_episode}화 회수`
                      : f.is_resolved
                      ? ' → 회수됨'
                      : ''}
                  </span>
                  {resolvingId === f.id && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-[10px] text-gray-500 shrink-0">화수:</span>
                      <input
                        type="number"
                        className="w-16 text-xs border border-green-300 rounded px-1.5 py-0.5 outline-none focus:border-green-500"
                        placeholder="예: 15"
                        value={resolvingEp}
                        onChange={(e) => setResolvingEp(e.target.value)}
                        min={f.planted_episode ?? 1}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter')
                            toggleMutation.mutate({ id: f.id, is_resolved: true, resolved_episode: resolvingEp ? Number(resolvingEp) : undefined })
                        }}
                      />
                      <button
                        onClick={() => toggleMutation.mutate({ id: f.id, is_resolved: true, resolved_episode: resolvingEp ? Number(resolvingEp) : undefined })}
                        className="shrink-0 px-2 py-0.5 text-[11px] bg-green-500 text-white rounded hover:bg-green-600"
                      >✓</button>
                      <button
                        onClick={() => { setResolvingId(null); setResolvingEp('') }}
                        className="shrink-0 px-1.5 py-0.5 text-[11px] text-gray-400 border border-gray-200 rounded hover:bg-gray-100"
                      >✕</button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!f.is_resolved ? (
                    resolvingId !== f.id && (
                      <button
                        onClick={() => { setResolvingId(f.id); setResolvingEp('') }}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                      >
                        회수
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => toggleMutation.mutate({ id: f.id, is_resolved: false })}
                      className="text-[10px] px-1 py-0.5 text-green-600 hover:text-gray-500 transition-colors"
                      title="미회수로 되돌리기"
                    >✓완료</button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(f.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-200 text-[#dc2626] transition-opacity"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {foreshadows.length === 0 && (
            <div className="py-3 text-center">
              <p className="text-[11px] text-gray-400">등록된 복선이 없습니다.</p>
              <p className="text-[10px] text-gray-300 mt-0.5">아래 폼에서 추가해보세요.</p>
            </div>
          )}
        </div>

        {/* 복선 입력 */}
        <div className="rounded-lg border border-red-100 p-2 space-y-2 bg-red-50/20">
          <input
            className="w-full text-xs border border-red-100 rounded px-2 py-1.5 outline-none focus:border-red-300 bg-white"
            placeholder="복선 내용... (예: 주인공이 숨긴 편지)"
            value={foreshadowInput}
            onChange={(e) => setForeshadowInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addForeshadow()}
            disabled={addMutation.isPending}
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-500 font-medium">🌱 심는 화수</span>
              <input
                type="number"
                className="w-full text-sm border border-red-200 rounded px-2 py-1.5 outline-none focus:border-red-400 bg-white font-medium text-center"
                placeholder="예: 3"
                value={plantedEp}
                onChange={(e) => setPlantedEp(e.target.value)}
                min={1}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-500 font-medium">📌 회수 화수</span>
              <input
                type="number"
                className="w-full text-sm border border-red-200 rounded px-2 py-1.5 outline-none focus:border-red-400 bg-white font-medium text-center"
                placeholder="예: 15"
                value={resolvedEp}
                onChange={(e) => setResolvedEp(e.target.value)}
                min={1}
              />
            </div>
          </div>
          <button
            onClick={addForeshadow}
            disabled={addMutation.isPending || !foreshadowInput.trim()}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded bg-[#dc2626] text-white text-xs font-medium hover:bg-red-700 disabled:opacity-40 transition-colors"
          >
            <Plus className="size-3.5" />
            복선 추가
          </button>
          <p className="text-[10px] text-gray-400 text-center">화수는 선택사항 — 나중에 수정 가능</p>
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
                <div
                  key={c.id}
                  className={`flex items-start gap-1.5 rounded px-2 py-1.5 group ${c.is_deceased ? 'bg-gray-100 border border-gray-200' : 'bg-[#e0f2fe]'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {c.is_deceased && <span className="text-[11px] shrink-0">💀</span>}
                      <span className={`text-xs font-semibold truncate ${c.is_deceased ? 'text-gray-400 line-through' : 'text-[#0c4a6e]'}`}>
                        {c.name}
                      </span>
                      <span className={`text-[10px] shrink-0 ${c.is_deceased ? 'text-gray-400' : 'text-[#0891b2]'}`}>
                        {c.is_deceased ? '사망' : c.role === 'protagonist' ? '주인공' : c.role === 'antagonist' ? '빌런' : '조연'}
                      </span>
                    </div>
                    {c.description && (
                      <p className={`text-[10px] mt-0.5 leading-snug line-clamp-2 ${c.is_deceased ? 'text-gray-400' : 'text-[#075985]'}`}>
                        {c.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleDeathMutation.mutate({ id: c.id, is_deceased: !c.is_deceased })}
                      className={`p-0.5 rounded text-[11px] ${c.is_deceased ? 'hover:bg-green-100 text-green-600' : 'hover:bg-gray-200 text-gray-500'}`}
                      title={c.is_deceased ? '생존으로 되돌리기' : '사망 처리'}
                    >
                      {c.is_deceased ? '↩' : '💀'}
                    </button>
                    <button
                      onClick={() => deleteCharMutation.mutate(c.id)}
                      className="p-0.5 rounded hover:bg-red-100 text-red-400"
                      title="삭제"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
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
