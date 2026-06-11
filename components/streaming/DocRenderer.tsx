'use client'

import React from 'react'

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

// ── table parser ───────────────────────────────────────────────────────────
function parseTableRows(lines: string[]): string[][] {
  return lines
    .filter(l => !/^\|[-:| ]+\|$/.test(l.trim()))
    .map(l =>
      l.split('|')
        .slice(1, -1)
        .map(c => c.trim())
    )
}

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

// ── block types ────────────────────────────────────────────────────────────
type Block =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'table'; rows: string[][] }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'quote'; text: string }
  | { type: 'hr' }
  | { type: 'checkbox'; checked: boolean; text: string }
  | { type: 'paragraph'; text: string }

function parseBlocks(content: string): Block[] {
  const lines = content.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) { i++; continue }

    // H2
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3) })
      i++
      continue
    }

    // H3
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4) })
      i++
      continue
    }

    // HR
    if (/^---+$/.test(trimmed)) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // Quote
    if (trimmed.startsWith('> ')) {
      blocks.push({ type: 'quote', text: trimmed.slice(2) })
      i++
      continue
    }

    // Table
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      blocks.push({ type: 'table', rows: parseTableRows(tableLines) })
      continue
    }

    // Checkbox
    if (/^- \[[ xX]\]/.test(trimmed)) {
      const checked = /^- \[[xX]\]/.test(trimmed)
      blocks.push({ type: 'checkbox', checked, text: trimmed.replace(/^- \[[ xX]\]\s*/, '') })
      i++
      continue
    }

    // Unordered list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        items.push(lines[i].trim().replace(/^[-*]\s/, ''))
        i++
      }
      blocks.push({ type: 'list', items, ordered: false })
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''))
        i++
      }
      blocks.push({ type: 'list', items, ordered: true })
      continue
    }

    // Paragraph (collect consecutive non-special lines)
    const textLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('|') &&
      !/^- /.test(lines[i].trim()) &&
      !/^\* /.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('>') &&
      !/^---+$/.test(lines[i].trim()) &&
      !/^\d+\.\s/.test(lines[i].trim())
    ) {
      textLines.push(lines[i])
      i++
    }
    if (textLines.join('').trim()) {
      blocks.push({ type: 'paragraph', text: textLines.join('\n') })
    } else if (i < lines.length && lines[i].trim()) {
      i++ // safety: advance past any line that matches no block pattern
    }
  }

  return blocks
}

// ── H2 색상 (문서 타입별) ──────────────────────────────────────────────────
const H2_COLORS = [
  'border-[#4f46e5] text-[#4f46e5]',
  'border-[#0891b2] text-[#0891b2]',
  'border-[#d97706] text-[#d97706]',
  'border-[#dc2626] text-[#dc2626]',
  'border-[#16a34a] text-[#16a34a]',
]

// ── main renderer ──────────────────────────────────────────────────────────
export function DocRenderer({ content }: { content: string }) {
  const blocks = parseBlocks(content)
  let h2Count = 0

  return (
    <div className="space-y-1">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h2': {
            const color = H2_COLORS[h2Count % H2_COLORS.length]
            h2Count++
            return (
              <div key={idx} className={`mt-6 mb-2 pb-1.5 border-b-2 ${color}`}>
                <h2 className={`text-base font-bold ${color.split(' ')[1]}`}>
                  <Inline text={block.text} />
                </h2>
              </div>
            )
          }

          case 'h3':
            return (
              <h3 key={idx} className="mt-4 mb-1 text-sm font-semibold text-gray-800">
                <Inline text={block.text} />
              </h3>
            )

          case 'table':
            return <DocTable key={idx} rows={block.rows} />

          case 'quote':
            return (
              <blockquote key={idx} className="my-3 pl-4 border-l-4 border-[#4f46e5] bg-[#f5f3ff] rounded-r-lg py-2 pr-3">
                <p className="text-sm font-medium text-[#4f46e5] leading-relaxed">
                  <Inline text={block.text} />
                </p>
              </blockquote>
            )

          case 'hr':
            return <hr key={idx} className="my-4 border-gray-200" />

          case 'list':
            return (
              <ul key={idx} className={`my-2 space-y-1 ${block.ordered ? 'list-decimal' : 'list-disc'} list-inside`}>
                {block.items.map((item, ii) => (
                  <li key={ii} className="text-sm text-gray-700 leading-relaxed pl-1">
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            )

          case 'checkbox':
            return (
              <div key={idx} className="flex items-start gap-2 my-1">
                <input type="checkbox" defaultChecked={block.checked} className="mt-0.5 accent-[#4f46e5]" readOnly />
                <span className={`text-sm text-gray-700 ${block.checked ? 'line-through text-gray-400' : ''}`}>
                  <Inline text={block.text} />
                </span>
              </div>
            )

          case 'paragraph':
            return (
              <p key={idx} className="text-sm text-gray-700 leading-relaxed my-1 whitespace-pre-line">
                <Inline text={block.text} />
              </p>
            )

          default:
            return null
        }
      })}
    </div>
  )
}
