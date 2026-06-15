'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw, Save, ExternalLink, Download, Pencil, Eye, History, TrendingUp, Network, Bookmark, Check, Undo2 } from 'lucide-react'
import { useProjectStore } from '@/stores/project'
import { StreamingText } from '@/components/streaming/StreamingText'
import { DocRenderer } from '@/components/streaming/DocRenderer'
import { DiffRenderer } from '@/components/streaming/DiffRenderer'
import { NotionExportDialog } from '@/components/export/NotionExportDialog'
import { VersionHistoryPanel } from '@/components/documents/VersionHistoryPanel'
import { LoglineInput } from '@/components/documents/LoglineInput'
import { SynopsisInput } from '@/components/documents/SynopsisInput'
import { PlotInput } from '@/components/documents/PlotInput'
import { PlotChapterInput } from '@/components/documents/PlotChapterInput'
import { TreatmentInput } from '@/components/documents/TreatmentInput'
import { StoryBibleInput } from '@/components/documents/StoryBibleInput'
import { BibleWorldInput } from '@/components/documents/BibleWorldInput'
import { BiblePowerInput } from '@/components/documents/BiblePowerInput'
import { BibleGlossaryInput } from '@/components/documents/BibleGlossaryInput'
import { CharacterCardInput } from '@/components/documents/CharacterCardInput'
import { EmotionCurve } from '@/components/visualizations/EmotionCurve'
import { CharacterMindMap } from '@/components/visualizations/CharacterMindMap'
import { ForeshadowTimeline } from '@/components/visualizations/ForeshadowTimeline'
import { deleteBlock } from '@/lib/docParser'
import { fetchCharacters, fetchForeshadows } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import type { Project, GenerateRequest } from '@/types'

interface EditorProps {
  project: Project
}

const DOC_META: Record<string, { title: string; desc: string; color: string }> = {
  logline:          { title: '로그라인',          desc: '한 줄로 압축한 이야기의 핵심',            color: '#4f46e5' },
  synopsis:         { title: '시놉시스',          desc: '전체 이야기 뼈대 (결말 포함)',             color: '#0891b2' },
  plot:             { title: '플롯 — 전체 아크',  desc: '아크 단위 감정 흐름·갈등·장면 설계',       color: '#16a34a' },
  'plot-chapter':   { title: '플롯 챕터',         desc: '챕터별 회차 단위 상세 플롯',              color: '#16a34a' },
  treatment:        { title: '트리트먼트',        desc: '회차별 장면 카드',                        color: '#d97706' },
  'story-bible':    { title: '스토리 바이블',     desc: '인물·세계관·용어 설정 개요',              color: '#0891b2' },
  'bible-world':    { title: '세계관·배경',       desc: '시대·공간·사회 구조·규칙 설정집',         color: '#0891b2' },
  'bible-power':    { title: '파워 시스템',       desc: '능력 체계·등급·제약 설정집',              color: '#7c3aed' },
  'bible-glossary': { title: '용어 사전',         desc: '작품 고유 용어·명사 정의집',              color: '#dc2626' },
  'character-card': { title: '캐릭터 카드',       desc: '인물 심리·관계·성장 설정카드',            color: '#db2777' },
}

// 변경 비교를 지원하는 문서 타입 (스토리 바이블, 시놉시스, 플롯)
const DIFF_SUPPORTED_TYPES = new Set(['story-bible', 'synopsis', 'plot'])

// ── 타입별 입력 폼 ────────────────────────────────────────────────────────────
function InputForm({
  type, project, doc, initialInput, onGenerate, onCancel,
}: {
  type: string
  project: Project
  doc: { title: string }
  initialInput: string
  onGenerate: (input: string) => void
  onCancel?: () => void
}) {
  const props = { initialInput, onGenerate, onCancel }
  switch (type) {
    case 'logline':          return <LoglineInput {...props} />
    case 'synopsis':         return <SynopsisInput {...props} />
    case 'plot':             return <PlotInput {...props} targetEpisodes={project.target_episodes} />
    case 'plot-chapter':     return <PlotChapterInput {...props} docTitle={doc.title} targetEpisodes={project.target_episodes} />
    case 'treatment':        return <TreatmentInput {...props} docTitle={doc.title} />
    case 'story-bible':      return <StoryBibleInput {...props} />
    case 'bible-world':      return <BibleWorldInput {...props} />
    case 'bible-power':      return <BiblePowerInput {...props} />
    case 'bible-glossary':   return <BibleGlossaryInput {...props} />
    case 'character-card':   return <CharacterCardInput {...props} docTitle={doc.title} />
    default:                 return null
  }
}

export function Editor({ project }: EditorProps) {
  const { selectedDocumentId, selectedDocumentType, selectedView, documents, updateDocument, addDocument, removeDocument } = useProjectStore()

  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [notionDialogOpen, setNotionDialogOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [showEmotionCurve, setShowEmotionCurve] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  // 변경 비교: 재생성 전 원본 내용 보관
  const [prevContent, setPrevContent] = useState<string | null>(null)

  const charDocs = useMemo(() => documents.filter(d => d.type === 'character-card'), [documents])

  const { data: characters = [], isLoading: charsLoading } = useQuery({
    queryKey: ['characters', project.id],
    queryFn: () => fetchCharacters(project.id),
    enabled: selectedView === 'character-map',
  })

  const { data: foreshadows = [] } = useQuery({
    queryKey: ['foreshadows', project.id],
    queryFn: () => fetchForeshadows(project.id),
  })

  const abortRef = useRef<AbortController | null>(null)

  const selectedDoc = documents.find((d) => d.id === selectedDocumentId)
  const meta = selectedDocumentType ? DOC_META[selectedDocumentType] : null

  useEffect(() => {
    setEditedContent(selectedDoc?.content ?? '')
    setIsDirty(false)
    setStreamedText('')
    setIsEditing(false)
    setEditMode(false)
    setError(null)
    setHistoryOpen(false)
    setShowEmotionCurve(false)
    setPrevContent(null)
    setEditingTitle(false)
  }, [selectedDocumentId])

  const isDiffMode = prevContent !== null && !isStreaming && !!streamedText

  async function generate(userInput: string) {
    if (!selectedDoc || !selectedDocumentType || !userInput.trim()) return
    setError(null)
    setStreamedText('')
    setIsStreaming(true)
    setIsEditing(false)
    setEditMode(false)

    // 기존 내용이 있고 diff 지원 타입이면 원본 보관
    if (selectedDoc.content && DIFF_SUPPORTED_TYPES.has(selectedDocumentType)) {
      setPrevContent(selectedDoc.content)
    } else {
      setPrevContent(null)
    }

    const controller = new AbortController()
    abortRef.current = controller

    const body: GenerateRequest = {
      type: selectedDocumentType,
      projectId: project.id,
      userInput: userInput.trim(),
      context: { logline: project.logline ?? undefined, genre: project.genre },
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? '생성에 실패했습니다')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6)
          if (raw === '[DONE]') continue
          try {
            const parsed = JSON.parse(raw)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) { accumulated += parsed.text; setStreamedText(accumulated) }
          } catch (e) {
            if (e instanceof SyntaxError) continue
            throw e
          }
        }
      }

      await saveContent(selectedDoc.id, accumulated, userInput.trim())
      setEditedContent(accumulated)
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setPrevContent(null)
        return
      }
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }

  async function saveContent(docId: string, content: string, input: string) {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, user_input: input, status: 'generated' }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(`저장 실패: ${json.error ?? `서버 오류 (${res.status})`}`)
        return
      }
      const updated = await res.json()
      updateDocument(updated.id, { content: updated.content, user_input: updated.user_input, status: updated.status })
      setIsDirty(false)
    } catch (e) {
      setError(e instanceof Error ? `저장 실패: ${e.message}` : '저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveTitle(newTitle: string) {
    const trimmed = newTitle.trim()
    setEditingTitle(false)
    if (!trimmed || !selectedDoc || trimmed === selectedDoc.title) return
    updateDocument(selectedDoc.id, { title: trimmed })
    await fetch(`/api/documents/${selectedDoc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    })
  }

  // 변경 수락: diff 해제하고 새 내용 유지
  function handleAcceptChanges() {
    setPrevContent(null)
    setStreamedText('')
  }

  // 이전으로 되돌리기: 원본 내용 복원
  async function handleRevertChanges() {
    if (!prevContent || !selectedDoc) return
    await saveContent(selectedDoc.id, prevContent, selectedDoc.user_input ?? '')
    setEditedContent(prevContent)
    setPrevContent(null)
    setStreamedText('')
  }

  // 블록 삭제 핸들러
  function handleDeleteBlock(blockIndex: number) {
    const current = isDirty ? editedContent : (selectedDoc?.content ?? '')
    const next = deleteBlock(current, blockIndex)
    setEditedContent(next)
    setIsDirty(true)
  }

  function handleDownload() {
    const content = isDirty ? editedContent : (selectedDoc?.content ?? '')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.title}_${meta?.title ?? ''}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── 특수 뷰: 복선 트래커 ─────────────────────────────────────────────────
  if (selectedView === 'foreshadow-tracker') {
    return (
      <div className="h-full flex flex-col">
        <div className="shrink-0 bg-white border-b border-gray-100 px-6 py-2.5 flex items-center gap-2">
          <Bookmark className="size-4 text-[#dc2626]" />
          <span className="text-sm font-semibold text-gray-800">복선 트래커</span>
          <span className="ml-2 text-xs text-gray-400">
            {foreshadows.length > 0 ? `총 ${foreshadows.length}개 · 미회수 ${foreshadows.filter(f => !f.is_resolved).length}개` : ''}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto">
            <ForeshadowTimeline foreshadows={foreshadows} />
          </div>
        </div>
      </div>
    )
  }

  // ── 특수 뷰: 인물 관계도 ─────────────────────────────────────────────────
  if (selectedView === 'character-map') {
    return (
      <div className="h-full flex flex-col">
        <div className="shrink-0 bg-white border-b border-gray-100 px-6 py-2.5 flex items-center gap-2">
          <Network className="size-4 text-[#db2777]" />
          <span className="text-sm font-semibold text-gray-800">인물 관계도</span>
          {charsLoading && (
            <span className="text-xs text-gray-400 ml-2">불러오는 중...</span>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          {!charsLoading && (
            <CharacterMindMap
              characters={characters}
              projectId={project.id}
              charDocs={charDocs}
              onDocumentCreated={(doc) => addDocument(doc)}
              onDocumentDeleted={(id) => removeDocument(id)}
              onDocumentUpdated={(id, updates) => updateDocument(id, updates)}
            />
          )}
        </div>
      </div>
    )
  }

  // ── 상태: 문서 없음 ───────────────────────────────────────────────────────
  if (!selectedDoc) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3 max-w-sm">
          <div className="text-4xl">📝</div>
          <h2 className="text-lg font-semibold text-gray-700">왼쪽 바인더에서 문서를 선택하세요</h2>
          <p className="text-sm text-gray-500">
            로그라인, 시놉시스, 플롯, 트리트먼트, 스토리 바이블 중 원하는 문서를 선택하면
            여기에 맞춤 입력 화면이 나타납니다.
          </p>
        </div>
      </div>
    )
  }

  // ── 상태: 스트리밍 중 ─────────────────────────────────────────────────────
  if (isStreaming || (streamedText && !isEditing)) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{meta?.title}</h1>
                <p className="text-xs text-gray-400 mt-0.5">{meta?.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <>
                    <span className="text-xs font-medium animate-pulse" style={{ color: meta?.color }}>
                      AI 작성 중...
                    </span>
                    <button
                      onClick={() => abortRef.current?.abort()}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                    >
                      중단
                    </button>
                  </>
                ) : isDiffMode ? (
                  /* diff 모드: 수락 / 이전으로 버튼 */
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 mr-1">변경 내용 확인</span>
                    <button
                      onClick={handleRevertChanges}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Undo2 className="size-3" />
                      이전으로
                    </button>
                    <button
                      onClick={handleAcceptChanges}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white transition-colors"
                      style={{ backgroundColor: meta?.color ?? '#4f46e5' }}
                    >
                      <Check className="size-3" />
                      변경 수락
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">{isSaving ? '저장 중...' : '저장 완료'}</span>
                )}
              </div>
            </div>

            {isStreaming ? (
              <StreamingText text={streamedText} isStreaming />
            ) : isDiffMode ? (
              /* 변경 비교 뷰 */
              <div>
                <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  이전 버전과 새 버전을 비교합니다.
                  <span className="mx-1.5 inline-flex items-center gap-0.5 font-medium">
                    <span className="inline-block w-2 h-2 rounded-sm bg-green-400" /> 추가됨
                  </span>
                  <span className="inline-flex items-center gap-0.5 font-medium">
                    <span className="inline-block w-2 h-2 rounded-sm bg-red-300" /> 삭제됨
                  </span>
                </div>
                <DiffRenderer oldContent={prevContent!} newContent={streamedText} />
              </div>
            ) : (
              <DocRenderer content={streamedText} />
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── 상태: 입력 폼 (비어있거나 재생성) ────────────────────────────────────
  if (selectedDoc.status === 'empty' || isEditing) {
    const accentColor = meta?.color ?? '#4f46e5'
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: accentColor }} />
              <h2 className="text-lg font-bold text-gray-900">{meta?.title} 작성</h2>
            </div>
            <p className="text-sm text-gray-500 ml-3">{meta?.desc}</p>
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <InputForm
            type={selectedDocumentType ?? ''}
            project={project}
            doc={selectedDoc}
            initialInput={isEditing ? (selectedDoc.user_input ?? '') : ''}
            onGenerate={generate}
            onCancel={isEditing ? () => setIsEditing(false) : undefined}
          />
        </div>
      </div>
    )
  }

  // ── 상태: 생성 완료 — 렌더 / 편집 ────────────────────────────────────────
  const displayContent = isDirty ? editedContent : (selectedDoc.content ?? '')

  return (
    <div className="h-full flex flex-col">
      {/* 툴바 */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ backgroundColor: meta?.color }} />
          <span className="text-sm font-semibold text-gray-800">{meta?.title}</span>
          {isDirty && <span className="text-xs text-amber-500 font-medium">● 수정됨</span>}
          {error && (
            <span className="text-xs text-red-500 font-medium">{error}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setEditMode((v) => !v); setError(null) }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              editMode
                ? 'bg-gray-100 border-gray-300 text-gray-700'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {editMode ? <Eye className="size-3" /> : <Pencil className="size-3" />}
            {editMode ? '미리보기' : '편집'}
          </button>

          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="size-3" />
            재생성
          </button>

          <button
            onClick={() => { setError(null); saveContent(selectedDoc.id, editedContent, selectedDoc.user_input ?? '') }}
            disabled={isSaving || !isDirty}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: isDirty ? (meta?.color ?? '#4f46e5') : '#9ca3af' }}
          >
            <Save className="size-3" />
            {isSaving ? '저장 중...' : '저장'}
          </button>

          <button onClick={handleDownload} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="size-3" />
            다운로드
          </button>

          <button onClick={() => setNotionDialogOpen(true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            <ExternalLink className="size-3" />
            Notion
          </button>

          {(selectedDocumentType === 'plot-chapter' || selectedDocumentType === 'plot') && displayContent && (
            <button
              onClick={() => setShowEmotionCurve((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                showEmotionCurve
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="size-3" />
              감정 곡선
            </button>
          )}

          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              historyOpen
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <History className="size-3" />
            히스토리
          </button>
        </div>
      </div>

      {/* 콘텐츠 + 히스토리 패널 */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto p-6">
          {showEmotionCurve ? (
            <EmotionCurve content={displayContent} />
          ) : (
            <div className="max-w-3xl mx-auto">
              {selectedDocumentType === 'character-card' && selectedDoc && !editMode && (
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
                  <span className="text-xs text-gray-400 shrink-0">캐릭터 이름</span>
                  {editingTitle ? (
                    <input
                      autoFocus
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={() => saveTitle(titleDraft)}
                      onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing) return
                        if (e.key === 'Enter') saveTitle(titleDraft)
                        if (e.key === 'Escape') setEditingTitle(false)
                      }}
                      className="text-base font-bold text-gray-900 border-b-2 border-[#db2777] outline-none bg-transparent min-w-[6rem] max-w-[20rem]"
                    />
                  ) : (
                    <button
                      onClick={() => { setTitleDraft(selectedDoc.title); setEditingTitle(true) }}
                      className="flex items-center gap-1.5 text-base font-bold text-gray-900 hover:text-[#db2777] transition-colors group"
                      title="클릭하여 이름 편집"
                    >
                      {selectedDoc.title}
                      <Pencil className="size-3.5 text-gray-400 group-hover:text-[#db2777] transition-colors" />
                    </button>
                  )}
                </div>
              )}
              {editMode ? (
                <textarea
                  className="w-full min-h-[600px] text-sm text-gray-800 leading-relaxed bg-transparent outline-none resize-none font-mono"
                  value={editedContent}
                  onChange={(e) => { setEditedContent(e.target.value); setIsDirty(true) }}
                  placeholder="내용을 직접 수정하세요."
                  autoFocus
                />
              ) : (
                <div className="relative">
                  {/* 편집 힌트 (DocRenderer 위에 겹치지 않는 영역에만 표시) */}
                  <div className="absolute -top-1 right-0 z-10">
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-1 text-[10px] text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5 shadow-sm hover:text-gray-600 hover:border-gray-300 transition-colors"
                    >
                      <Pencil className="size-2.5" />
                      전체 편집
                    </button>
                  </div>
                  {/* 블록 단위 삭제 — 삭제 버튼 클릭이 편집 전환과 충돌하지 않음 */}
                  <DocRenderer
                    content={displayContent}
                    onDelete={handleDeleteBlock}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {historyOpen && (
          <div className="w-72 shrink-0">
            <VersionHistoryPanel
              documentId={selectedDoc.id}
              onRestore={(content, userInput) => {
                setEditedContent(content)
                updateDocument(selectedDoc.id, { content, user_input: userInput, status: 'generated' })
                setIsDirty(false)
                setHistoryOpen(false)
              }}
              onClose={() => setHistoryOpen(false)}
            />
          </div>
        )}
      </div>

      <NotionExportDialog
        documentId={selectedDoc.id}
        documentTitle={meta?.title ?? selectedDoc.title}
        open={notionDialogOpen}
        onOpenChange={setNotionDialogOpen}
      />
    </div>
  )
}
