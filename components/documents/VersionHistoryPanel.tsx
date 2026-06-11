'use client'

import { useEffect, useState } from 'react'
import { History, RotateCcw, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { DocumentVersion } from '@/types'

interface Props {
  documentId: string
  onRestore: (content: string, userInput: string) => void
  onClose: () => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function VersionHistoryPanel({ documentId, onRestore, onClose }: Props) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/documents/${documentId}/versions`)
      .then((r) => r.json())
      .then((data) => {
        setVersions(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setError('버전 목록을 불러오지 못했습니다')
        setLoading(false)
      })
  }, [documentId])

  async function handleRestore(version: DocumentVersion) {
    if (!confirm(`v${version.version_number} 버전으로 복원할까요?\n현재 내용은 새 버전으로 자동 저장됩니다.`)) return
    setRestoringId(version.id)
    setError(null)
    try {
      const res = await fetch(`/api/documents/${documentId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: version.id }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? '복원 실패')
      }
      const updated = await res.json()
      onRestore(updated.content, updated.user_input)

      // 복원 후 목록 갱신
      const listRes = await fetch(`/api/documents/${documentId}/versions`)
      const list = await listRes.json()
      setVersions(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '복원 중 오류가 발생했습니다')
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100">
      {/* 헤더 */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <History className="size-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-800">버전 히스토리</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-24 text-sm text-gray-400">
            불러오는 중...
          </div>
        )}

        {!loading && error && (
          <p className="m-4 text-sm text-red-500">{error}</p>
        )}

        {!loading && !error && versions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-4">
            <History className="size-8 text-gray-200" />
            <p className="text-sm text-gray-400">아직 저장된 버전이 없습니다.</p>
            <p className="text-xs text-gray-300">문서를 저장할 때마다 이전 버전이 여기에 기록됩니다.</p>
          </div>
        )}

        {!loading && versions.map((v) => {
          const isExpanded = expandedId === v.id
          const preview = v.content.slice(0, 120).replace(/\n/g, ' ')

          return (
            <div key={v.id} className="border-b border-gray-50 last:border-0">
              {/* 버전 행 */}
              <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="shrink-0 mt-0.5">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
                    {v.version_number}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">{formatDate(v.saved_at)}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : v.id)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
                        title="내용 미리보기"
                      >
                        {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </button>
                      <button
                        onClick={() => handleRestore(v)}
                        disabled={restoringId === v.id}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-40"
                        title="이 버전으로 복원"
                      >
                        <RotateCcw className="size-3" />
                        복원
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{preview || '(내용 없음)'}</p>
                </div>
              </div>

              {/* 펼쳐진 미리보기 */}
              {isExpanded && (
                <div className="px-4 pb-3 ml-9">
                  <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{v.content}</p>
                  </div>
                  {v.user_input && (
                    <div className="mt-2 bg-amber-50 rounded-lg px-3 py-2">
                      <span className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">입력 조건</span>
                      <p className="text-xs text-amber-800 mt-0.5 whitespace-pre-wrap">{v.user_input}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="shrink-0 px-4 py-2 border-t border-gray-100">
        <p className="text-[11px] text-gray-300 text-center">저장할 때마다 이전 버전이 자동 기록됩니다</p>
      </div>
    </div>
  )
}
