'use client'

import { useRef, useState } from 'react'
import {
  ChevronDown, ChevronRight, FileText, BarChart2, BookOpen, Bookmark,
  AlignLeft, Plus, Loader2, Globe, Zap, BookMarked, User, Layers, Network, Trash2,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useProjectStore } from '@/stores/project'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Project, Document, DocumentType } from '@/types'

interface BinderProps {
  project: Project
}

// ── 단일 문서 버튼 (로그라인, 시놉시스 등) ─────────────────────────────
function SingleDocItem({
  type,
  label,
  icon: Icon,
  color,
  tintClass,
  doc,
  selectedId,
  onSelect,
}: {
  type: DocumentType
  label: string
  icon: React.ElementType
  color: string
  tintClass: string
  doc: Document | undefined
  selectedId: string | null
  onSelect: (id: string, type: DocumentType) => void
}) {
  const isSelected = doc ? selectedId === doc.id : false
  return (
    <button
      onClick={() => doc && onSelect(doc.id, type)}
      disabled={!doc}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors',
        isSelected ? `${tintClass} font-medium` : 'text-gray-700 hover:bg-gray-100',
        !doc && 'opacity-40 cursor-default'
      )}
    >
      <Icon className="size-4 shrink-0" style={{ color }} />
      <span className="flex-1 truncate">{label}</span>
      {doc?.status === 'generated' && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      )}
      {!doc && <Badge variant="default" className="text-[10px] h-4">빈칸</Badge>}
    </button>
  )
}

// ── 접을 수 있는 섹션 헤더 ───────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  color,
  label,
  isOpen,
  onToggle,
}: {
  icon: React.ElementType
  color: string
  label: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors hover:bg-gray-100 text-gray-700"
    >
      {isOpen ? (
        <ChevronDown className="size-3.5 shrink-0 text-gray-400" />
      ) : (
        <ChevronRight className="size-3.5 shrink-0 text-gray-400" />
      )}
      <Icon className="size-4 shrink-0" style={{ color }} />
      <span className="flex-1 truncate font-medium">{label}</span>
    </button>
  )
}

// ── 서브 항목 버튼 (들여쓰기) ─────────────────────────────────────────────
function SubItem({
  icon: Icon,
  label,
  color,
  selectedBg,
  selectedText,
  isSelected,
  isGenerated,
  isLoading,
  onClick,
}: {
  icon: React.ElementType
  label: string
  color: string
  selectedBg: string
  selectedText: string
  isSelected: boolean
  isGenerated: boolean
  isLoading?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors',
        isSelected ? `${selectedBg} ${selectedText} font-medium` : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      {isLoading ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-gray-400" />
      ) : (
        <Icon className="size-3.5 shrink-0" style={{ color: isSelected ? undefined : color }} />
      )}
      <span className="flex-1 truncate">{label}</span>
      {isGenerated && !isLoading && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      )}
    </button>
  )
}

// ── 추가 버튼 ─────────────────────────────────────────────────────────────
function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
    >
      <Plus className="size-3.5 shrink-0" />
      <span>{label}</span>
    </button>
  )
}

// ── 인라인 입력 + 추가 폼 ──────────────────────────────────────────────────
function InlineAddForm({
  accentColor,
  placeholder,
  value,
  onChange,
  onConfirm,
  onCancel,
  isCreating,
  error,
}: {
  accentColor: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
  isCreating: boolean
  error: string | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="px-2 py-1 space-y-1">
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return
            if (e.key === 'Enter') onConfirm()
            if (e.key === 'Escape') onCancel()
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 text-xs border rounded px-1.5 py-1 outline-none"
          style={{ borderColor: accentColor }}
          disabled={isCreating}
          autoFocus
        />
        <button
          onClick={onConfirm}
          disabled={!value.trim() || isCreating}
          className="shrink-0 p-1 rounded disabled:opacity-40 transition-colors hover:opacity-80"
          style={{ color: accentColor }}
        >
          {isCreating ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-500 leading-tight">{error}</p>}
    </div>
  )
}

// ── 메인 Binder 컴포넌트 ──────────────────────────────────────────────────

export function Binder({ project }: BinderProps) {
  const { selectedDocumentId, selectedView, selectDocument, setSelectedView, addDocument, removeDocument, documents } = useProjectStore()

  const qc = useQueryClient()

  // 섹션 열림/닫힘 상태
  const [plotOpen, setPlotOpen] = useState(true)
  const [treatmentOpen, setTreatmentOpen] = useState(true)
  const [bibleOpen, setBibleOpen] = useState(true)
  const [charOpen, setCharOpen] = useState(true)

  // 추가 폼 상태
  const [addingPlotChapter, setAddingPlotChapter] = useState(false)
  const [addingTreatment, setAddingTreatment] = useState(false)
  const [addingChar, setAddingChar] = useState(false)

  const [newPlotTitle, setNewPlotTitle] = useState('')
  const [newTreatmentTitle, setNewTreatmentTitle] = useState('')
  const [newCharTitle, setNewCharTitle] = useState('')

  const [creatingPlot, setCreatingPlot] = useState(false)
  const [creatingTreatment, setCreatingTreatment] = useState(false)
  const [creatingChar, setCreatingChar] = useState(false)

  const [plotError, setPlotError] = useState<string | null>(null)
  const [treatmentError, setTreatmentError] = useState<string | null>(null)
  const [charError, setCharError] = useState<string | null>(null)

  // 바이블 섹션 자동 생성 로딩
  const [bibleLoading, setBibleLoading] = useState<Partial<Record<DocumentType, boolean>>>({})

  // 문서 조회 헬퍼
  const getDoc = (type: DocumentType) => documents.find((d) => d.type === type)
  const getDocs = (type: DocumentType) =>
    documents.filter((d) => d.type === type).sort((a, b) => a.title.localeCompare(b.title))

  // ── API 헬퍼 ─────────────────────────────────────────────────────────────
  async function createDoc(type: DocumentType, title: string): Promise<Document | null> {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: project.id, type, title }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error ?? `서버 오류 (${res.status})`)
    }
    return res.json()
  }

  // ── 플롯 챕터 추가 ────────────────────────────────────────────────────────
  async function handleAddPlotChapter() {
    const title = newPlotTitle.trim()
    if (!title) return
    setCreatingPlot(true)
    setPlotError(null)
    try {
      const doc = await createDoc('plot-chapter', title)
      if (doc) { addDocument(doc); selectDocument(doc.id, 'plot-chapter') }
      setNewPlotTitle('')
      setAddingPlotChapter(false)
    } catch (e) {
      setPlotError(e instanceof Error ? e.message : '추가에 실패했습니다.')
    } finally {
      setCreatingPlot(false)
    }
  }

  // ── 트리트먼트 추가 ───────────────────────────────────────────────────────
  async function handleAddTreatment() {
    const title = newTreatmentTitle.trim()
    if (!title) return
    setCreatingTreatment(true)
    setTreatmentError(null)
    try {
      const doc = await createDoc('treatment', title)
      if (doc) { addDocument(doc); selectDocument(doc.id, 'treatment') }
      setNewTreatmentTitle('')
      setAddingTreatment(false)
    } catch (e) {
      setTreatmentError(e instanceof Error ? e.message : '추가에 실패했습니다.')
    } finally {
      setCreatingTreatment(false)
    }
  }

  // ── 문서 삭제 ─────────────────────────────────────────────────────────────
  async function handleDeleteDoc(id: string, label: string) {
    if (!window.confirm(`'${label}'을(를) 삭제할까요?`)) return
    removeDocument(id)
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
  }

  // ── 캐릭터 카드 추가 ──────────────────────────────────────────────────────
  async function handleAddChar() {
    const title = newCharTitle.trim()
    if (!title) return
    setCreatingChar(true)
    setCharError(null)
    try {
      const doc = await createDoc('character-card', title)
      if (doc) { addDocument(doc); selectDocument(doc.id, 'character-card') }

      // 인물 관계도 자동 연동
      fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id, name: title, role: 'supporting', description: '' }),
      }).then(() => qc.invalidateQueries({ queryKey: ['characters', project.id] })).catch(() => {})

      setNewCharTitle('')
      setAddingChar(false)
    } catch (e) {
      setCharError(e instanceof Error ? e.message : '추가에 실패했습니다.')
    } finally {
      setCreatingChar(false)
    }
  }

  // ── 바이블 섹션 클릭 (없으면 자동 생성) ──────────────────────────────────
  const BIBLE_META: Record<string, { type: DocumentType; title: string }> = {
    'bible-world':    { type: 'bible-world',    title: '세계관·배경' },
    'bible-power':    { type: 'bible-power',    title: '파워 시스템' },
    'bible-glossary': { type: 'bible-glossary', title: '용어 사전' },
  }

  async function selectOrCreateBible(key: string) {
    const meta = BIBLE_META[key]
    if (!meta) return
    const existing = getDoc(meta.type)
    if (existing) { selectDocument(existing.id, meta.type); return }
    setBibleLoading((prev) => ({ ...prev, [meta.type]: true }))
    try {
      const doc = await createDoc(meta.type, meta.title)
      if (doc) { addDocument(doc); selectDocument(doc.id, meta.type) }
    } catch {
      // silently ignore — user can retry by clicking again
    } finally {
      setBibleLoading((prev) => ({ ...prev, [meta.type]: false }))
    }
  }

  // ── 렌더 ─────────────────────────────────────────────────────────────────
  const loglineDoc = getDoc('logline')
  const synopsisDoc = getDoc('synopsis')
  const plotDoc = getDoc('plot')
  const plotChapters = getDocs('plot-chapter')
  const treatmentDocs = getDocs('treatment')
  const charDocs = getDocs('character-card')

  return (
    <div className="flex flex-col h-full">
      {/* 프로젝트 제목 */}
      <div className="px-3 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
          {project.title}
        </p>
      </div>

      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">

        {/* ── 로그라인 ── */}
        <div className="group relative flex items-center">
          <div className="flex-1 min-w-0">
            <SingleDocItem
              type="logline" label="로그라인" icon={AlignLeft}
              color="#4f46e5" tintClass="bg-[#ede9fe] text-[#4f46e5]"
              doc={loglineDoc} selectedId={selectedDocumentId} onSelect={selectDocument}
            />
          </div>
          {loglineDoc && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteDoc(loglineDoc.id, '로그라인') }}
              className="absolute right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-opacity z-10"
              title="삭제"
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </div>

        {/* ── 시놉시스 ── */}
        <div className="group relative flex items-center">
          <div className="flex-1 min-w-0">
            <SingleDocItem
              type="synopsis" label="시놉시스" icon={FileText}
              color="#0891b2" tintClass="bg-[#e0f2fe] text-[#0891b2]"
              doc={synopsisDoc} selectedId={selectedDocumentId} onSelect={selectDocument}
            />
          </div>
          {synopsisDoc && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteDoc(synopsisDoc.id, '시놉시스') }}
              className="absolute right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-opacity z-10"
              title="삭제"
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </div>

        {/* ── 플롯 섹션 ── */}
        <SectionHeader icon={BarChart2} color="#16a34a" label="플롯" isOpen={plotOpen} onToggle={() => setPlotOpen((v) => !v)} />
        {plotOpen && (
          <div className="ml-6 mt-0.5 space-y-0.5">
            {/* 전체 아크 구조 */}
            {plotDoc && (
              <SubItem
                icon={Layers} label="전체 아크 구조" color="#16a34a"
                selectedBg="bg-[#dcfce7]" selectedText="text-[#16a34a]"
                isSelected={selectedDocumentId === plotDoc.id}
                isGenerated={plotDoc.status === 'generated'}
                onClick={() => selectDocument(plotDoc.id, 'plot')}
              />
            )}
            {!plotDoc && (
              <p className="text-[10px] text-gray-400 px-2 py-1">전체 아크 문서 없음</p>
            )}
            {/* 챕터 목록 */}
            {plotChapters.map((d) => (
              <div key={d.id} className="group relative flex items-center">
                <div className="flex-1 min-w-0">
                  <SubItem
                    icon={FileText} label={d.title} color="#16a34a"
                    selectedBg="bg-[#dcfce7]" selectedText="text-[#16a34a]"
                    isSelected={selectedDocumentId === d.id}
                    isGenerated={d.status === 'generated'}
                    onClick={() => selectDocument(d.id, 'plot-chapter')}
                  />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteDoc(d.id, d.title) }}
                  className="absolute right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-opacity z-10"
                  title="삭제"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
            {/* 챕터 추가 */}
            {addingPlotChapter ? (
              <InlineAddForm
                accentColor="#16a34a"
                placeholder="예: 1챕터 (1~15화)"
                value={newPlotTitle}
                onChange={(v) => { setNewPlotTitle(v); setPlotError(null) }}
                onConfirm={handleAddPlotChapter}
                onCancel={() => { setAddingPlotChapter(false); setNewPlotTitle(''); setPlotError(null) }}
                isCreating={creatingPlot}
                error={plotError}
              />
            ) : (
              <AddButton label="챕터 추가" onClick={() => { setAddingPlotChapter(true); setPlotError(null) }} />
            )}
          </div>
        )}

        {/* ── 트리트먼트 섹션 ── */}
        <SectionHeader icon={Bookmark} color="#d97706" label="트리트먼트" isOpen={treatmentOpen} onToggle={() => setTreatmentOpen((v) => !v)} />
        {treatmentOpen && (
          <div className="ml-6 mt-0.5 space-y-0.5">
            {treatmentDocs.map((d) => (
              <div key={d.id} className="group relative flex items-center">
                <div className="flex-1 min-w-0">
                  <SubItem
                    icon={FileText} label={d.title} color="#d97706"
                    selectedBg="bg-[#fef3c7]" selectedText="text-[#d97706]"
                    isSelected={selectedDocumentId === d.id}
                    isGenerated={d.status === 'generated'}
                    onClick={() => selectDocument(d.id, 'treatment')}
                  />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteDoc(d.id, d.title) }}
                  className="absolute right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-opacity z-10"
                  title="삭제"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
            {addingTreatment ? (
              <InlineAddForm
                accentColor="#d97706"
                placeholder="예: 1화, 11~20화"
                value={newTreatmentTitle}
                onChange={(v) => { setNewTreatmentTitle(v); setTreatmentError(null) }}
                onConfirm={handleAddTreatment}
                onCancel={() => { setAddingTreatment(false); setNewTreatmentTitle(''); setTreatmentError(null) }}
                isCreating={creatingTreatment}
                error={treatmentError}
              />
            ) : (
              <AddButton label="회차 추가" onClick={() => { setAddingTreatment(true); setTreatmentError(null) }} />
            )}
          </div>
        )}

        {/* ── 스토리 바이블 섹션 ── */}
        <SectionHeader icon={BookOpen} color="#0891b2" label="스토리 바이블" isOpen={bibleOpen} onToggle={() => setBibleOpen((v) => !v)} />
        {bibleOpen && (
          <div className="ml-6 mt-0.5 space-y-0.5">
            {([
              { key: 'bible-world',    icon: Globe,      label: '세계관·배경', color: '#0891b2' },
              { key: 'bible-power',    icon: Zap,        label: '파워 시스템', color: '#7c3aed' },
              { key: 'bible-glossary', icon: BookMarked, label: '용어 사전',   color: '#dc2626' },
            ] as const).map(({ key, icon: Icon, label, color }) => {
              const doc = getDoc(key as DocumentType)
              const isLoading = !!bibleLoading[key as DocumentType]
              return (
                <SubItem
                  key={key} icon={Icon} label={label} color={color}
                  selectedBg={key === 'bible-world' ? 'bg-[#e0f2fe]' : key === 'bible-power' ? 'bg-[#ede9fe]' : 'bg-[#fee2e2]'}
                  selectedText={key === 'bible-world' ? 'text-[#0891b2]' : key === 'bible-power' ? 'text-[#7c3aed]' : 'text-[#dc2626]'}
                  isSelected={!!doc && selectedDocumentId === doc.id}
                  isGenerated={doc?.status === 'generated'}
                  isLoading={isLoading}
                  onClick={() => selectOrCreateBible(key)}
                />
              )
            })}
          </div>
        )}

        {/* ── 복선 트래커 ── */}
        <button
          onClick={() => setSelectedView('foreshadow-tracker')}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors',
            selectedView === 'foreshadow-tracker'
              ? 'bg-[#fee2e2] text-[#dc2626] font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <Bookmark className="size-4 shrink-0" style={{ color: '#dc2626' }} />
          <span className="flex-1">복선 트래커</span>
        </button>

        {/* ── 인물 관계도 ── */}
        <button
          onClick={() => setSelectedView('character-map')}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors',
            selectedView === 'character-map'
              ? 'bg-[#fce7f3] text-[#db2777] font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <Network className="size-4 shrink-0" style={{ color: '#db2777' }} />
          <span className="flex-1">인물 관계도</span>
        </button>

        {/* ── 캐릭터 카드 섹션 ── */}
        <SectionHeader icon={User} color="#db2777" label="캐릭터 카드" isOpen={charOpen} onToggle={() => setCharOpen((v) => !v)} />
        {charOpen && (
          <div className="ml-6 mt-0.5 space-y-0.5">
            {charDocs.map((d) => (
              <div key={d.id} className="group relative flex items-center">
                <div className="flex-1 min-w-0">
                  <SubItem
                    icon={User} label={d.title} color="#db2777"
                    selectedBg="bg-[#fce7f3]" selectedText="text-[#db2777]"
                    isSelected={selectedDocumentId === d.id}
                    isGenerated={d.status === 'generated'}
                    onClick={() => selectDocument(d.id, 'character-card')}
                  />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteDoc(d.id, d.title) }}
                  className="absolute right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-opacity z-10"
                  title="삭제"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
            {addingChar ? (
              <InlineAddForm
                accentColor="#db2777"
                placeholder="예: 이수아"
                value={newCharTitle}
                onChange={(v) => { setNewCharTitle(v); setCharError(null) }}
                onConfirm={handleAddChar}
                onCancel={() => { setAddingChar(false); setNewCharTitle(''); setCharError(null) }}
                isCreating={creatingChar}
                error={charError}
              />
            ) : (
              <AddButton label="캐릭터 추가" onClick={() => { setAddingChar(true); setCharError(null) }} />
            )}
          </div>
        )}
      </nav>

      <div className="px-3 py-3 border-t border-gray-100 shrink-0">
        <p className="text-xs text-gray-400">
          목표: {project.target_episodes}화 · {project.genre}
        </p>
      </div>
    </div>
  )
}
