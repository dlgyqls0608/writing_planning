import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  AlignmentType,
} from 'docx'
import { Block } from './docParser'

function parseInlineRuns(text: string, options: { bold?: boolean; size?: number } = {}): TextRun[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map(part => {
    if (part.startsWith('**') && part.endsWith('**'))
      return new TextRun({ text: part.slice(2, -2), bold: true, size: options.size })
    if (part.startsWith('*') && part.endsWith('*'))
      return new TextRun({ text: part.slice(1, -1), italics: true, bold: options.bold, size: options.size })
    return new TextRun({ text: part, bold: options.bold, size: options.size })
  })
}

const CELL_BORDER = { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' }
const CELL_BORDERS = {
  top: CELL_BORDER,
  bottom: CELL_BORDER,
  left: CELL_BORDER,
  right: CELL_BORDER,
}

function blockToElements(block: Block): (Paragraph | Table)[] {
  switch (block.type) {
    case 'h2':
      return [new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: parseInlineRuns(block.text),
        spacing: { before: 320, after: 120 },
      })]

    case 'h3':
      return [new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: parseInlineRuns(block.text),
        spacing: { before: 240, after: 80 },
      })]

    case 'paragraph':
      return [new Paragraph({
        children: parseInlineRuns(block.text),
        spacing: { before: 60, after: 60 },
      })]

    case 'quote':
      return [new Paragraph({
        indent: { left: 720 },
        border: { left: { style: BorderStyle.THICK, size: 6, color: '4F46E5' } },
        children: parseInlineRuns(block.text, { bold: false }),
        spacing: { before: 120, after: 120 },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'EEF2FF' },
      })]

    case 'hr':
      return [new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
        children: [],
        spacing: { before: 160, after: 160 },
      })]

    case 'checkbox':
      return [new Paragraph({
        children: [
          new TextRun({ text: block.checked ? '☑ ' : '☐ ' }),
          ...parseInlineRuns(block.text),
        ],
        spacing: { before: 40, after: 40 },
      })]

    case 'list':
      return block.items.map((item, i) => new Paragraph({
        bullet: block.ordered ? undefined : { level: 0 },
        children: [
          ...(block.ordered ? [new TextRun({ text: `${i + 1}. ` })] : []),
          ...parseInlineRuns(item),
        ],
        spacing: { before: 40, after: 40 },
      }))

    case 'table': {
      if (!block.rows.length) return []
      const [head, ...body] = block.rows
      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: head.map(h => new TableCell({
                shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F3F4F6' },
                borders: CELL_BORDERS,
                children: [new Paragraph({
                  children: [new TextRun({ text: h, bold: true, size: 18 })],
                  spacing: { before: 60, after: 60 },
                })],
              })),
            }),
            ...body.map((row, ri) => new TableRow({
              children: row.map(cell => new TableCell({
                shading: {
                  type: ShadingType.CLEAR,
                  color: 'auto',
                  fill: ri % 2 === 1 ? 'F9FAFB' : 'FFFFFF',
                },
                borders: CELL_BORDERS,
                children: [new Paragraph({
                  children: parseInlineRuns(cell, { size: 18 }),
                  spacing: { before: 60, after: 60 },
                })],
              })),
            })),
          ],
        }),
        new Paragraph({ children: [], spacing: { before: 80 } }),
      ]
    }

    default:
      return []
  }
}

export async function exportToDocx(
  blocks: Block[],
  projectTitle: string,
  docTitle: string,
): Promise<Blob> {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: projectTitle, bold: true, size: 32, color: '111827' })],
          spacing: { after: 80 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: docTitle, size: 24, color: '6B7280' })],
          spacing: { after: 480 },
        }),
        ...blocks.flatMap(blockToElements),
      ],
    }],
  })

  return Packer.toBlob(doc)
}
