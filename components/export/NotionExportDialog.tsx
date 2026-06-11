'use client'

import { useState } from 'react'
import { ExternalLink, CheckCircle2, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface NotionExportDialogProps {
  documentId: string
  documentTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ExportResult {
  success: boolean
  message: string
  notionPageId?: string
}

export function NotionExportDialog({
  documentId,
  documentTitle,
  open,
  onOpenChange,
}: NotionExportDialogProps) {
  const [notionPageId, setNotionPageId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ExportResult | null>(null)

  async function handleExport() {
    if (!notionPageId.trim()) return
    setIsLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/export/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, notionPageId: notionPageId.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setResult({ success: false, message: data.error ?? '내보내기에 실패했습니다' })
      } else {
        setResult({
          success: true,
          message: 'Notion에 성공적으로 내보냈습니다.',
          notionPageId: data.notionPageId,
        })
        setNotionPageId('')
      }
    } catch {
      setResult({ success: false, message: '네트워크 오류가 발생했습니다' })
    } finally {
      setIsLoading(false)
    }
  }

  function handleClose() {
    if (isLoading) return
    setResult(null)
    setNotionPageId('')
    onOpenChange(false)
  }

  const notionUrl = result?.notionPageId
    ? `https://www.notion.so/${result.notionPageId.replace(/-/g, '')}`
    : null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-base font-bold">Notion으로 내보내기</span>
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-gray-700">{documentTitle}</span>
            {' '}문서를 Notion 페이지 하위에 새 페이지로 생성합니다.
          </DialogDescription>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 -mt-1">
            <span>✦ 문서 타입별 이모지 아이콘</span>
            <span>✦ 색상 헤딩</span>
            <span>✦ 목차 자동 생성</span>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 성공 결과 */}
          {result?.success ? (
            <div className="flex flex-col gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                <p className="text-sm font-medium text-green-700">{result.message}</p>
              </div>
              {notionUrl && (
                <a
                  href={notionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 transition-colors rounded-lg px-3 py-1.5 w-fit"
                >
                  <ExternalLink className="size-3" />
                  Notion에서 열기
                </a>
              )}
            </div>
          ) : (
            <>
              {/* 입력 필드 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Notion 부모 페이지 ID
                </label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                  placeholder="예: 1234567890abcdef1234567890abcdef"
                  value={notionPageId}
                  onChange={(e) => setNotionPageId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExport()}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-400">
                  Notion 페이지 URL 끝의 32자리 ID (하이픈 포함/제외 모두 가능)
                  <br />
                  예: notion.so/my-page-<span className="font-mono">1234567890abcdef...</span>
                </p>
              </div>

              {/* 에러 */}
              {result && !result.success && (
                <div className="flex items-start gap-2 text-sm px-3 py-2 rounded-lg border bg-red-50 border-red-100 text-red-700">
                  <XCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{result.message}</span>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {result?.success ? '닫기' : '취소'}
          </button>
          {!result?.success && (
            <button
              type="button"
              onClick={handleExport}
              disabled={isLoading || !notionPageId.trim()}
              className="px-4 py-2 text-sm bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '내보내는 중...' : '내보내기'}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
