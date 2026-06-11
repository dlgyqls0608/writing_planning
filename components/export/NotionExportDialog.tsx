'use client'

import { useState } from 'react'
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

export function NotionExportDialog({
  documentId,
  documentTitle,
  open,
  onOpenChange,
}: NotionExportDialogProps) {
  const [notionPageId, setNotionPageId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

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
        setResult({ success: true, message: `Notion에 성공적으로 내보냈습니다.` })
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notion으로 내보내기</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-gray-700">{documentTitle}</span> 문서를 Notion
            페이지 하위에 새 페이지로 생성합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Notion 부모 페이지 ID
            </label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
              placeholder="예: 1234567890abcdef1234567890abcdef"
              value={notionPageId}
              onChange={(e) => setNotionPageId(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400">
              Notion 페이지 URL에서 하이픈을 제거한 32자리 ID입니다.
              <br />
              예: notion.so/my-page-<span className="font-mono">1234567890abcdef...</span>
            </p>
          </div>

          {result && (
            <div
              className={`text-sm px-3 py-2 rounded-lg border ${
                result.success
                  ? 'bg-green-50 border-green-100 text-green-700'
                  : 'bg-red-50 border-red-100 text-red-700'
              }`}
            >
              {result.message}
            </div>
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
