import { Client } from '@notionhq/client'

let _client: Client | null = null

export function getNotionClient(): Client {
  if (!_client) {
    _client = new Client({
      auth: process.env.NOTION_API_KEY,
    })
  }
  return _client
}

// Notion API block count limit per request
const BLOCK_LIMIT = 100

export async function appendContentToPage(
  pageId: string,
  title: string,
  content: string
): Promise<string> {
  const notion = getNotionClient()

  // Create a new child page under the specified parent
  const newPage = await notion.pages.create({
    parent: { type: 'page_id', page_id: pageId },
    properties: {
      title: {
        title: [{ type: 'text', text: { content: title } }],
      },
    },
  })

  // Convert plain text to paragraph blocks
  const lines = content.split('\n')
  const allBlocks = lines.map((line) => ({
    object: 'block' as const,
    type: 'paragraph' as const,
    paragraph: {
      rich_text:
        line.trim().length > 0
          ? [{ type: 'text' as const, text: { content: line } }]
          : [],
    },
  }))

  // Append in batches of 100 (Notion API limit)
  for (let i = 0; i < allBlocks.length; i += BLOCK_LIMIT) {
    const batch = allBlocks.slice(i, i + BLOCK_LIMIT)
    await notion.blocks.children.append({
      block_id: newPage.id,
      children: batch,
    })
  }

  return newPage.id
}
