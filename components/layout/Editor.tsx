'use client'

import { useState, useRef } from 'react'
import { Sparkles, RotateCcw, Save, ExternalLink } from 'lucide-react'
import { useProjectStore } from '@/stores/project'
import { StreamingText } from '@/components/streaming/StreamingText'
import { NotionExportDialog } from '@/components/export/NotionExportDialog'
import type { Project, GenerateRequest } from '@/types'

interface EditorProps {
  project: Project
}

const DOC_META: Record<string, { title: string; desc: string; placeholder: string }> = {
  logline: {
    title: '로그라인',
    desc: '한 줄로 압축한 이야기의 핵심',
    placeholder:
      '예: 재벌 후계자에게 억울하게 해고당한 평범한 직장인이, 10년 후 그 회사를 인수하기 위해 모든 것을 건다.',
  },
  synopsis: {
    title: '시놉시스',
    desc: '전체 이야기 뼈대 (결말 포함)',
    placeholder: '주인공, 핵심 갈등, 주요 사건, 결말에 대한 아이디어를 자유롭게 적어주세요.',
  },
  plot: {
    title: '플롯',
    desc: '회차 단위 감정 흐름·갈등·장면 설계',
    placeholder: '작품의 전체 흐름, 주요 아크, 결정적 장면 아이디어를 적어주세요.',
  },
  treatment: {
    title: '트리트먼트',
    desc: '장면별 세부 회차 카드',
    placeholder: '도입부(1~10화) 핵심 장면과 전달할 감정에 대한 아이디어를 적어주세요.',
  },
  'story-bible': {
    title: '스토리 바이블',
    desc: '인물·세계관·용어 설정집',
    placeholder:
      '주요 인물의 특성, 세계관 설정, 독특한 시스템이나 용어 등을 자유롭게 적어주세요.',
  },
}

export function Editor({ project }: EditorProps) {
  const { selectedDocumentId, selectedDocumentType, documents, updateDocument } = useProjectStore()

  const [userInput, setUserInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  // Lets a "generated" doc return to the idea form for regeneration
  const [isEditing, setIsEditing] = useState(false)
  const [notionDialogOpen, setNotionDialogOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const selectedDoc = documents.find((d) => d.id === selectedDocumentId)
  const meta = selectedDocumentType ? DOC_META[selectedDocumentType] : null

  async function generate(input: string) {
    if (!selectedDoc || !selectedDocumentType || !input.trim()) return
    setError(null)
    setStreamedText('')
    setIsStreaming(true)
    setIsEditing(false)

    const controller = new AbortController()
    abortRef.current = controller

    const body: GenerateRequest = {
      type: selectedDocumentType,
      projectId: project.id,
      userInput: input.trim(),
      context: {
        logline: project.logline ?? undefined,
        genre: project.genre,
      },
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
            if (parsed.text) {
              accumulated += parsed.text
              setStreamedText(accumulated)
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue
            throw parseErr
          }
        }
      }

      await saveContent(selectedDoc.id, accumulated, input.trim())
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
      if (res.ok) {
        const updated = await res.json()
        updateDocument(updated.id, { content: updated.content, user_input: updated.user_input, status: updated.status })
      }
    } finally {
      setIsSaving(false)
    }
  }

  function handleRegenerate() {
    if (!selectedDoc) return
    const prev = selectedDoc.user_input || ''
    setUserInput(prev)
    setIsEditing(true)
    setStreamedText('')
    setError(null)
  }

  // ── No document selected ──────────────────────────────────────────────────
  if (!selectedDoc) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3 max-w-sm">
          <div className="text-4xl">📝</div>
          <h2 className="text-lg font-semibold text-gray-700">왼쪽 바인더에서 문서를 선택하세요</h2>
          <p className="text-sm text-gray-500">
            로그라인, 시놉시스, 플롯, 트리트먼트, 스토리 바이블 중 원하는 문서를 클릭하면 여기에
            내용이 표시됩니다.
          </p>
        </div>
      </div>
    )
  }

  // ── Streaming result view ─────────────────────────────────────────────────
  if (isStreaming || (streamedText && !isEditing)) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">{meta?.title}</h1>
              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <>
                    <span className="text-xs text-[#4f46e5] font-medium animate-pulse">
                      생성 중...
                    </span>
                    <button
                      onClick={() => abortRef.current?.abort()}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      중단
                    </button>
                  </>
                ) : (
                  <>
                    {isSaving && <span className="text-xs text-gray-400">저장 중...</span>}
                    <button
                      onClick={() => {
                        setStreamedText('')
                        setUserInput('')
                      }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <RotateCcw className="size-3" />
                      다시 입력
                    </button>
                  </>
                )}
              </div>
            </div>
            <StreamingText text={streamedText} isStreaming={isStreaming} />
          </div>
        </div>
      </div>
    )
  }

  // ── Idea input form (empty doc OR editing for regeneration) ───────────────
  if (selectedDoc.status === 'empty' || isEditing) {
    return (
      <div className="h-full flex items-start justify-center pt-12 px-6 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-900">{meta?.title} 작성</h2>
            <p className="text-sm text-gray-500">{meta?.desc}</p>
          </div>

          <textarea
            className="w-full min-h-[180px] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 resize-none leading-relaxed"
            placeholder={meta?.placeholder}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between">
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                취소
              </button>
            )}
            <div className="ml-auto">
              <button
                onClick={() => generate(userInput)}
                disabled={!userInput.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#4f46e5] text-white text-sm font-medium rounded-lg hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles className="size-4" />
                AI 생성
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Generated / finalized: show saved content ─────────────────────────────
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">
              {meta?.title ?? selectedDoc.title}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <RotateCcw className="size-3" />
                재생성
              </button>
              <button
                onClick={() =>
                  saveContent(
                    selectedDoc.id,
                    selectedDoc.content ?? '',
                    selectedDoc.user_input ?? ''
                  )
                }
                disabled={isSaving}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#4f46e5] text-white hover:bg-[#4338ca] disabled:opacity-50 transition-colors"
              >
                <Save className="size-3" />
                {isSaving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => setNotionDialogOpen(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ExternalLink className="size-3" />
                Notion
              </button>
            </div>
          </div>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
              {selectedDoc.content}
            </pre>
          </div>
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
