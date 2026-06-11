import { Client } from '@notionhq/client'

let _client: Client | null = null

export function getNotionClient(): Client {
  if (!_client) {
    _client = new Client({ auth: process.env.NOTION_API_KEY })
  }
  return _client
}

const BLOCK_LIMIT = 100

// ── Inline rich-text parser (bold / italic / code) ─────────────────────────

type RichText = {
  type: 'text'
  text: { content: string }
  annotations: { bold: boolean; italic: boolean; code: boolean; strikethrough: boolean; underline: boolean; color: 'default' }
}

function parseInline(raw: string): RichText[] {
  const tokens: RichText[] = []
  // Matches **bold**, *italic*, `code`
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = regex.exec(raw)) !== null) {
    if (m.index > last) tokens.push(plain(raw.slice(last, m.index)))
    if (m[1] !== undefined) tokens.push(styled(m[1], { bold: true }))
    else if (m[2] !== undefined) tokens.push(styled(m[2], { italic: true }))
    else if (m[3] !== undefined) tokens.push(styled(m[3], { code: true }))
    last = m.index + m[0].length
  }
  if (last < raw.length) tokens.push(plain(raw.slice(last)))
  return tokens.length > 0 ? tokens : [plain(raw)]
}

function plain(content: string): RichText {
  return { type: 'text', text: { content }, annotations: { bold: false, italic: false, code: false, strikethrough: false, underline: false, color: 'default' } }
}

function styled(content: string, flags: { bold?: boolean; italic?: boolean; code?: boolean }): RichText {
  return {
    type: 'text',
    text: { content },
    annotations: {
      bold: flags.bold ?? false,
      italic: flags.italic ?? false,
      code: flags.code ?? false,
      strikethrough: false,
      underline: false,
      color: 'default',
    },
  }
}

// ── Block constructors ─────────────────────────────────────────────────────

type Block = Record<string, unknown>

function mkH2(text: string): Block {
  return { object: 'block', type: 'heading_2', heading_2: { rich_text: parseInline(text), color: 'default', is_toggleable: false } }
}

function mkH3(text: string): Block {
  return { object: 'block', type: 'heading_3', heading_3: { rich_text: parseInline(text), color: 'default', is_toggleable: false } }
}

function mkParagraph(text: string): Block {
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: parseInline(text) } }
}

function mkEmptyParagraph(): Block {
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: [] } }
}

function mkDivider(): Block {
  return { object: 'block', type: 'divider', divider: {} }
}

function mkCallout(text: string): Block {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: parseInline(text),
      icon: { type: 'emoji', emoji: '✦' },
      color: 'yellow_background',
    },
  }
}

function mkQuote(text: string): Block {
  return { object: 'block', type: 'quote', quote: { rich_text: parseInline(text) } }
}

function mkBullet(text: string): Block {
  return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: parseInline(text) } }
}

function mkTodo(text: string, checked: boolean): Block {
  return { object: 'block', type: 'to_do', to_do: { rich_text: parseInline(text), checked } }
}

function mkTable(rows: string[][]): Block {
  const tableWidth = rows[0]?.length ?? 1
  return {
    object: 'block',
    type: 'table',
    table: {
      table_width: tableWidth,
      has_column_header: true,
      has_row_header: false,
      children: rows.map((cells) => ({
        object: 'block',
        type: 'table_row',
        table_row: {
          cells: cells.map((cell) => parseInline(cell)),
        },
      })),
    },
  }
}

// ── Markdown → Notion blocks ───────────────────────────────────────────────

function parseMarkdownToBlocks(markdown: string): Block[] {
  const lines = markdown.split('\n')
  const blocks: Block[] = []
  let i = 0
  let lastWasEmpty = false

  while (i < lines.length) {
    const line = lines[i]

    // Heading 2
    if (line.startsWith('## ')) {
      blocks.push(mkH2(line.slice(3).trim()))
      lastWasEmpty = false
      i++
      continue
    }

    // Heading 3
    if (line.startsWith('### ')) {
      blocks.push(mkH3(line.slice(4).trim()))
      lastWasEmpty = false
      i++
      continue
    }

    // Divider
    if (line.trim() === '---') {
      blocks.push(mkDivider())
      lastWasEmpty = false
      i++
      continue
    }

    // Blockquote / callout
    if (line.startsWith('> ')) {
      const text = line.slice(2).trim()
      // ✦ 강조 완성 로그라인은 callout으로
      if (text.startsWith('✦') || blocks.some((b) => (b.heading_2 as { rich_text?: Array<{ text?: { content?: string } }> } | undefined)?.rich_text?.[0]?.text?.content?.includes('✦'))) {
        blocks.push(mkCallout(text))
      } else {
        blocks.push(mkQuote(text))
      }
      lastWasEmpty = false
      i++
      continue
    }

    // To-do checkbox
    const todoMatch = line.match(/^- \[([ xX])\] (.*)/)
    if (todoMatch) {
      blocks.push(mkTodo(todoMatch[2], todoMatch[1].toLowerCase() === 'x'))
      lastWasEmpty = false
      i++
      continue
    }

    // Bulleted list (- item or * item)
    if (line.match(/^[-*] /)) {
      blocks.push(mkBullet(line.slice(2)))
      lastWasEmpty = false
      i++
      continue
    }

    // Table — detect by leading pipe and next non-empty line being alignment row
    if (line.startsWith('|')) {
      const tableRows: string[][] = []
      let j = i
      while (j < lines.length && lines[j].startsWith('|')) {
        const isAlignRow = /^\|[\s\-:|]+\|/.test(lines[j])
        if (!isAlignRow) {
          const cells = lines[j]
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
          if (cells.length > 0) tableRows.push(cells)
        }
        j++
      }
      if (tableRows.length > 0) {
        // Normalize column count
        const maxCols = Math.max(...tableRows.map((r) => r.length))
        const normalized = tableRows.map((r) => {
          while (r.length < maxCols) r.push('')
          return r
        })
        blocks.push(mkTable(normalized))
      }
      i = j
      lastWasEmpty = false
      continue
    }

    // Empty line — add one empty paragraph as visual spacing (skip consecutive)
    if (line.trim() === '') {
      if (!lastWasEmpty && blocks.length > 0) {
        blocks.push(mkEmptyParagraph())
      }
      lastWasEmpty = true
      i++
      continue
    }

    // Fallback: regular paragraph
    blocks.push(mkParagraph(line))
    lastWasEmpty = false
    i++
  }

  return blocks
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function appendContentToPage(
  pageId: string,
  title: string,
  content: string
): Promise<string> {
  const notion = getNotionClient()

  const newPage = await notion.pages.create({
    parent: { type: 'page_id', page_id: pageId },
    properties: {
      title: {
        title: [{ type: 'text', text: { content: title } }],
      },
    },
  })

  const allBlocks = parseMarkdownToBlocks(content)

  // Append in batches — tables count as 1 top-level block regardless of row count
  for (let i = 0; i < allBlocks.length; i += BLOCK_LIMIT) {
    const batch = allBlocks.slice(i, i + BLOCK_LIMIT)
    await notion.blocks.children.append({
      block_id: newPage.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: batch as any,
    })
  }

  return newPage.id
}
