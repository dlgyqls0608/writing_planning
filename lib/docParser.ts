// Shared markdown block parser — used by DocRenderer and DiffRenderer

export type Block =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'table'; rows: string[][] }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'quote'; text: string }
  | { type: 'hr' }
  | { type: 'checkbox'; checked: boolean; text: string }
  | { type: 'paragraph'; text: string }

function parseTableRows(lines: string[]): string[][] {
  return lines
    .filter(l => !/^\|[-:| ]+\|$/.test(l.trim()))
    .map(l =>
      l.split('|')
        .slice(1, -1)
        .map(c => c.trim())
    )
}

export function parseBlocks(content: string): Block[] {
  const lines = content.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) { i++; continue }

    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3) })
      i++
      continue
    }

    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4) })
      i++
      continue
    }

    if (/^---+$/.test(trimmed)) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    if (trimmed.startsWith('> ')) {
      blocks.push({ type: 'quote', text: trimmed.slice(2) })
      i++
      continue
    }

    if (trimmed.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      blocks.push({ type: 'table', rows: parseTableRows(tableLines) })
      continue
    }

    if (/^- \[[ xX]\]/.test(trimmed)) {
      const checked = /^- \[[xX]\]/.test(trimmed)
      blocks.push({ type: 'checkbox', checked, text: trimmed.replace(/^- \[[ xX]\]\s*/, '') })
      i++
      continue
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items: string[] = []
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* ')) &&
        !/^- \[[ xX]\]/.test(lines[i].trim())
      ) {
        items.push(lines[i].trim().replace(/^[-*]\s/, ''))
        i++
      }
      blocks.push({ type: 'list', items, ordered: false })
      continue
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''))
        i++
      }
      blocks.push({ type: 'list', items, ordered: true })
      continue
    }

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
      i++
    }
  }

  return blocks
}

export function blockToMarkdown(block: Block): string {
  switch (block.type) {
    case 'h2': return `## ${block.text}`
    case 'h3': return `### ${block.text}`
    case 'paragraph': return block.text
    case 'list':
      return block.items.map((item, idx) =>
        block.ordered ? `${idx + 1}. ${item}` : `- ${item}`
      ).join('\n')
    case 'quote': return `> ${block.text}`
    case 'hr': return '---'
    case 'checkbox': return `- [${block.checked ? 'x' : ' '}] ${block.text}`
    case 'table': {
      if (block.rows.length === 0) return ''
      const [head, ...body] = block.rows
      const headerRow = `| ${head.join(' | ')} |`
      const separator = `| ${head.map(() => '---').join(' | ')} |`
      const bodyRows = body.map(row => `| ${row.join(' | ')} |`)
      return [headerRow, separator, ...bodyRows].join('\n')
    }
  }
}

export function deleteBlock(content: string, blockIndex: number): string {
  const blocks = parseBlocks(content)
  return blocks
    .filter((_, i) => i !== blockIndex)
    .map(blockToMarkdown)
    .join('\n\n')
}
