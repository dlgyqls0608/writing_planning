'use client'

import { useEffect, useRef, useState } from 'react'
import { RotateCcw, Save, ExternalLink, Download, Pencil, Eye } from 'lucide-react'
import { useProjectStore } from '@/stores/project'
import { StreamingText } from '@/components/streaming/StreamingText'
import { DocRenderer } from '@/components/streaming/DocRenderer'
import { NotionExportDialog } from '@/components/export/NotionExportDialog'
import { LoglineInput } from '@/components/documents/LoglineInput'
import { SynopsisInput } from '@/components/documents/SynopsisInput'
import { PlotInput } from '@/components/documents/PlotInput'
import { TreatmentInput } from '@/components/documents/TreatmentInput'
import { StoryBibleInput } from '@/components/documents/StoryBibleInput'
import type { Project, GenerateRequest } from '@/types'

interface EditorProps {
  project: Project
}

const DOC_META: Record<string, { title: string; desc: string; color: string }> = {
  logline:      { title: '로그라인',    desc: '한 줄로 압축한 이야기의 핵심',        color: '#4f46e5' },
  synopsis:     { title: '시놉시스',    desc: '전체 이야기 뼈대 (결말 포함)',         color: '#0891b2' },
  plot:         { title: '플롯',        desc: '아크 단위 감정 흐름·갈등·장면 설계',   color: '#16a34a' },
  treatment:    { title: '트리트먼트',  desc: '회차별 장면 카드',                    color: '#d97706' },
  'story-bible':{ title: '스토리 바이블', desc: '인물·세계관·용어 설정집',            color: '#dc2626' },
}

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
    case 'logline':      return <LoglineInput {...props} />
    case 'synopsis':     return <SynopsisInput {...props} />
    case 'plot':         return <PlotInput {...props} targetEpisodes={project.target_episodes} />
    case 'treatment':    return <TreatmentInput {...props} docTitle={doc.title} />
    case 'story-bible':  return <StoryBibleInput {...props} />
    default:             return null
  }
}

export function Editor({ project }: EditorProps) {
  const { selectedDocumentId, selectedDocumentType, documents, updateDocument } = useProjectStore()

  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)   // 재생성을 위한 재입력 모드
  const [editMode, setEditMode] = useState(false)      // 생성된 결과 텍스트 직접 편집
  const [editedContent, setEditedContent] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [notionDialogOpen, setNotionDialogOpen] = useState(false)

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
  }, [selectedDocumentId])

  async function generate(userInput: string) {
    if (!selectedDoc || !selectedDocumentType || !userInput.trim()) return
    setError(null)
    setStreamedText('')
    setIsStreaming(true)
    setIsEditing(false)
    setEditMode(false)

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
      if ((err as Error).name === 'AbortError') return
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
                ) : (
                  <span className="text-xs text-gray-400">{isSaving ? '저장 중...' : '저장 완료'}</span>
                )}
              </div>
            </div>

            {isStreaming ? (
              <StreamingText text={streamedText} isStreaming />
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
          {/* 헤더 */}
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
          {/* 미리보기 / 편집 토글 */}
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
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {editMode ? (
            <textarea
              className="w-full min-h-[600px] text-sm text-gray-800 leading-relaxed bg-transparent outline-none resize-none font-mono"
              value={editedContent}
              onChange={(e) => { setEditedContent(e.target.value); setIsDirty(true) }}
              placeholder="내용을 직접 수정하세요."
              autoFocus
            />
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setEditMode(true)}
              onKeyDown={(e) => e.key === 'Enter' && setEditMode(true)}
              className="group relative cursor-text"
              title="클릭하여 편집"
            >
              <div className="absolute inset-0 -m-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity border-2 border-dashed border-gray-300 pointer-events-none" />
              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5 shadow-sm">
                  <Pencil className="size-2.5" />
                  클릭하여 편집
                </span>
              </div>
              <DocRenderer content={displayContent} />
            </div>
          )}
        </div>
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
