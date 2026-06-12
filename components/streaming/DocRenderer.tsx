'use client'

import React from 'react'
import { X } from 'lucide-react'
import { parseBlocks, Block } from '@/lib/docParser'

// ── inline parser: **bold**, *italic* ──────────────────────────────────────
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**'))
          return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
        if (p.startsWith('*') && p.endsWith('*'))
          return <em key={i}>{p.slice(1, -1)}</em>
        return <React.Fragment key={i}>{p}</React.Fragment>
      })}
    </>
  )
}

// ── table renderer ─────────────────────────────────────────────────────────
function DocTable({ rows }: { rows: string[][] }) {
  if (rows.length === 0) return null
  const [head, ...body] = rows
  return (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {head.map((h, i) => (
              <th key={i} className="text-left px-3 py-2 font-semibold text-gray-700 border border-gray-200 text-xs">
                <Inline text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 border border-gray-200 text-gray-700 text-xs align-top">
                  <Inline text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── H2 색상 (섹션 순서별) ──────────────────────────────────────────────────
const H2_COLORS = [
  'border-[#4f46e5] text-[#4f46e5]',
  'border-[#0891b2] text-[#0891b2]',
  'border-[#d97706] text-[#d97706]',
  'border-[#dc2626] text-[#dc2626]',
  'border-[#16a34a] text-[#16a34a]',
]

// ── 블록 콘텐츠 렌더 ────────────────────────────────────────────────────────
function renderBlockContent(block: Block, h2ColorClass: string): React.ReactNode {
  switch (block.type) {
    case 'h2':
      return (
        <div className={`mt-6 mb-2 pb-1.5 border-b-2 ${h2ColorClass}`}>
          <h2 className={`text-base font-bold ${h2ColorClass.split(' ')[1]}`}>
            <Inline text={block.text} />
          </h2>
        </div>
      )

    case 'h3':
      return (
        <h3 className="mt-4 mb-1 text-sm font-semibold text-gray-800">
          <Inline text={block.text} />
        </h3>
      )

    case 'table':
      return <DocTable rows={block.rows} />

    case 'quote':
      return (
        <blockquote className="my-3 pl-4 border-l-4 border-[#4f46e5] bg-[#f5f3ff] rounded-r-lg py-2 pr-3">
          <p className="text-sm font-medium text-[#4f46e5] leading-relaxed">
            <Inline text={block.text} />
          </p>
        </blockquote>
      )

    case 'hr':
      return <hr className="my-4 border-gray-200" />

    case 'list':
      return (
        <ul className={`my-2 space-y-1 ${block.ordered ? 'list-decimal' : 'list-disc'} list-inside`}>
          {block.items.map((item, ii) => (
            <li key={ii} className="text-sm text-gray-700 leading-relaxed pl-1">
              <Inline text={item} />
            </li>
          ))}
        </ul>
      )

    case 'checkbox':
      return (
        <div className="flex items-start gap-2 my-1">
          <input type="checkbox" defaultChecked={block.checked} className="mt-0.5 accent-[#4f46e5]" readOnly />
          <span className={`text-sm text-gray-700 ${block.checked ? 'line-through text-gray-400' : ''}`}>
            <Inline text={block.text} />
          </span>
        </div>
      )

    case 'paragraph':
      return (
        <p className="text-sm text-gray-700 leading-relaxed my-1 whitespace-pre-line">
          <Inline text={block.text} />
        </p>
      )

    default:
      return null
  }
}

// ── main renderer ──────────────────────────────────────────────────────────
interface DocRendererProps {
  content: string
  onDelete?: (blockIndex: number) => void
}

export function DocRenderer({ content, onDelete }: DocRendererProps) {
  const blocks = parseBlocks(content)
  let h2Count = 0

  return (
    <div className="space-y-1">
      {blocks.map((block, idx) => {
        let colorClass = ''
        if (block.type === 'h2') {
          colorClass = H2_COLORS[h2Count % H2_COLORS.length]
          h2Count++
        }

        const rendered = renderBlockContent(block, colorClass)

        if (!onDelete) {
          return <React.Fragment key={idx}>{rendered}</React.Fragment>
        }

        return (
          <div key={idx} className="relative group/block">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(idx) }}
              className="absolute -right-1 top-0.5 z-10 opacity-0 group-hover/block:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-red-50 border border-gray-200 hover:border-red-300 text-gray-300 hover:text-red-400 shadow-sm"
              title="이 블록 삭제"
            >
              <X className="size-3" />
            </button>
            {rendered}
          </div>
        )
      })}
    </div>
  )
}
