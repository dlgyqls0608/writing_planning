'use client'

import { useMemo } from 'react'
import { computeDiff, DiffType } from '@/lib/diff'
import { DocRenderer } from './DocRenderer'

interface Segment {
  type: DiffType
  content: string
}

function toSegments(oldText: string, newText: string): Segment[] {
  const diffLines = computeDiff(oldText, newText)
  const segments: Segment[] = []

  for (const dl of diffLines) {
    const last = segments[segments.length - 1]
    if (last && last.type === dl.type) {
      last.content += '\n' + dl.text
    } else {
      segments.push({ type: dl.type, content: dl.text })
    }
  }

  return segments
}

interface Props {
  oldContent: string
  newContent: string
}

export function DiffRenderer({ oldContent, newContent }: Props) {
  const segments = useMemo(() => toSegments(oldContent, newContent), [oldContent, newContent])

  const addedCount = segments.filter(s => s.type === 'added').length
  const removedCount = segments.filter(s => s.type === 'removed').length

  return (
    <div className="space-y-0.5">
      {/* 범례 */}
      <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
        {addedCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-200 border-l-2 border-green-500" />
            추가됨
          </span>
        )}
        {removedCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-100 border-l-2 border-red-400" />
            삭제됨
          </span>
        )}
      </div>

      {segments.map((seg, i) => {
        if (seg.type === 'unchanged') {
          return (
            <div key={i}>
              <DocRenderer content={seg.content} />
            </div>
          )
        }

        if (seg.type === 'added') {
          return (
            <div key={i} className="relative pl-3 py-0.5 bg-green-50 border-l-[3px] border-green-400 rounded-r-lg">
              <DocRenderer content={seg.content} />
            </div>
          )
        }

        // removed
        return (
          <div key={i} className="relative pl-3 py-0.5 bg-red-50 border-l-[3px] border-red-300 rounded-r-lg opacity-60">
            <DocRenderer content={seg.content} />
          </div>
        )
      })}
    </div>
  )
}
