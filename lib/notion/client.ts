import { Client } from '@notionhq/client'

let _client: Client | null = null

export function getNotionClient(): Client {
  if (!_client) {
    _client = new Client({ auth: process.env.NOTION_API_KEY })
  }
  return _client
}

const BLOCK_LIMIT = 100

// ── Notion color tokens ────────────────────────────────────────────────────
type NotionColor =
  | 'default' | 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red'
  | 'gray_background' | 'brown_background' | 'orange_background' | 'yellow_background'
  | 'green_background' | 'blue_background' | 'purple_background' | 'pink_background' | 'red_background'

// ── Doc-type metadata: emoji icon + accent color + label ──────────────────
const DOC_TYPE_META: Record<string, { emoji: string; color: NotionColor; label: string }> = {
  logline:          { emoji: '✏️',  color: 'purple_background', label: '로그라인' },
  synopsis:         { emoji: '📄',  color: 'blue_background',   label: '시놉시스' },
  plot:             { emoji: '📊',  color: 'green_background',  label: '플롯 — 전체 아크' },
  'plot-chapter':   { emoji: '📑',  color: 'green_background',  label: '플롯 챕터' },
  treatment:        { emoji: '🎬',  color: 'orange_background', label: '트리트먼트' },
  'story-bible':    { emoji: '📚',  color: 'blue_background',   label: '스토리 바이블' },
  'bible-world':    { emoji: '🌍',  color: 'blue_background',   label: '세계관·배경' },
  'bible-power':    { emoji: '⚡',  color: 'purple_background', label: '파워 시스템' },
  'bible-glossary': { emoji: '📖',  color: 'red_background',    label: '용어 사전' },
  'character-card': { emoji: '👤',  color: 'pink_background',   label: '캐릭터 카드' },
}

// H2 배경색 순환 (DocRenderer H2_COLORS와 동일한 계열)
const H2_CYCLE: NotionColor[] = [
  'purple_background',
  'blue_background',
  'orange_background',
  'red_background',
  'green_background',
]

// ── Inline rich-text parser (bold / italic / code) ─────────────────────────

type RichText = {
  type: 'text'
  text: { content: string }
  annotations: { bold: boolean; italic: boolean; code: boolean; strikethrough: boolean; underline: boolean; color: 'default' }
}

function parseInline(raw: string): RichText[] {
  const tokens: RichText[] = []
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
  return {
    type: 'text',
    text: { content },
    annotations: { bold: false, italic: false, code: false, strikethrough: false, underline: false, color: 'default' },
  }
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

function mkH1(text: string): Block {
  return { object: 'block', type: 'heading_1', heading_1: { rich_text: parseInline(text), color: 'default', is_toggleable: false } }
}

function mkH2(text: string, color: NotionColor = 'default'): Block {
  return { object: 'block', type: 'heading_2', heading_2: { rich_text: parseInline(text), color, is_toggleable: false } }
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

function mkTableOfContents(): Block {
  return { object: 'block', type: 'table_of_contents', table_of_contents: { color: 'default' } }
}

function mkCallout(text: string, emoji = '✦', color: NotionColor = 'yellow_background'): Block {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: parseInline(text),
      icon: { type: 'emoji', emoji },
      color,
    },
  }
}

function mkQuote(text: string): Block {
  return { object: 'block', type: 'quote', quote: { rich_text: parseInline(text) } }
}

function mkBullet(text: string): Block {
  return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: parseInline(text) } }
}

function mkNumbered(text: string): Block {
  return { object: 'block', type: 'numbered_list_item', numbered_list_item: { rich_text: parseInline(text) } }
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
        table_row: { cells: cells.map((cell) => parseInline(cell)) },
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
  let h2Count = 0

  while (i < lines.length) {
    const line = lines[i]

    // Heading 1 (# but not ##)
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      blocks.push(mkH1(line.slice(2).trim()))
      lastWasEmpty = false
      i++
      continue
    }

    // Heading 2 — cycling background color
    if (line.startsWith('## ')) {
      blocks.push(mkH2(line.slice(3).trim(), H2_CYCLE[h2Count % H2_CYCLE.length]))
      h2Count++
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

    // Blockquote → callout if starts with emphasis markers, else quote
    if (line.startsWith('> ')) {
      const text = line.slice(2).trim()
      if (text.startsWith('✦') || text.startsWith('💡') || text.startsWith('⚠') || text.startsWith('!')) {
        blocks.push(mkCallout(text, '💡', 'yellow_background'))
      } else {
        blocks.push(mkQuote(text))
      }
      lastWasEmpty = false
      i++
      continue
    }

    // To-do checkbox — must come before bullet list check
    const todoMatch = line.match(/^- \[([ xX])\] (.*)/)
    if (todoMatch) {
      blocks.push(mkTodo(todoMatch[2], todoMatch[1].toLowerCase() === 'x'))
      lastWasEmpty = false
      i++
      continue
    }

    // Bulleted list (- or *)
    if (line.match(/^[-*] /)) {
      blocks.push(mkBullet(line.slice(2)))
      lastWasEmpty = false
      i++
      continue
    }

    // Ordered list (1. 2. etc.)
    if (line.match(/^\d+\. /)) {
      blocks.push(mkNumbered(line.replace(/^\d+\. /, '')))
      lastWasEmpty = false
      i++
      continue
    }

    // Table
    if (line.startsWith('|')) {
      const tableRows: string[][] = []
      let j = i
      while (j < lines.length && lines[j].startsWith('|')) {
        const isAlignRow = /^\|[\s\-:|]+\|/.test(lines[j])
        if (!isAlignRow) {
          const cells = lines[j].split('|').slice(1, -1).map((c) => c.trim())
          if (cells.length > 0) tableRows.push(cells)
        }
        j++
      }
      if (tableRows.length > 0) {
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

    // Empty line — single spacing block (skip consecutive)
    if (line.trim() === '') {
      if (!lastWasEmpty && blocks.length > 0) blocks.push(mkEmptyParagraph())
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
  content: string,
  docType?: string
): Promise<string> {
  const notion = getNotionClient()
  const typeMeta = docType ? (DOC_TYPE_META[docType] ?? null) : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newPage = await notion.pages.create({
    parent: { type: 'page_id', page_id: pageId },
    ...(typeMeta ? { icon: { type: 'emoji', emoji: typeMeta.emoji } } : {}),
    properties: {
      title: { title: [{ type: 'text', text: { content: title } }] },
    },
  } as Parameters<typeof notion.pages.create>[0])

  // ── 상단 장식 블록: 문서 타입 callout + 목차 ───────────────────────────
  const headerBlocks: Block[] = []

  if (typeMeta) {
    headerBlocks.push(mkCallout(`NovelForge · ${typeMeta.label}`, typeMeta.emoji, typeMeta.color))
    headerBlocks.push(mkEmptyParagraph())
  }

  headerBlocks.push(mkTableOfContents())
  headerBlocks.push(mkDivider())

  const allBlocks = [...headerBlocks, ...parseMarkdownToBlocks(content)]

  for (let i = 0; i < allBlocks.length; i += BLOCK_LIMIT) {
    await notion.blocks.children.append({
      block_id: newPage.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: allBlocks.slice(i, i + BLOCK_LIMIT) as any,
    })
  }

  return newPage.id
}
