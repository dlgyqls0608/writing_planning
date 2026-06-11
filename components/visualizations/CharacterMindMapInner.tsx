'use client'

import { useCallback, useMemo } from 'react'
import {
  ReactFlow, Background, Controls, Handle, Position,
  type Node, type Edge, type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Character } from '@/types'

const ROLE_COLOR: Record<string, { bg: string; border: string; text: string; label: string }> = {
  protagonist: { bg: '#ede9fe', border: '#4f46e5', text: '#3730a3', label: '주인공' },
  antagonist:  { bg: '#fee2e2', border: '#dc2626', text: '#991b1b', label: '빌런'  },
  supporting:  { bg: '#e0f2fe', border: '#0891b2', text: '#0c4a6e', label: '조연'  },
}

type CharacterNodeData = {
  name: string
  role: string
  description?: string
  [key: string]: unknown
}

function CharacterNode({ data }: NodeProps<Node<CharacterNodeData>>) {
  const style = ROLE_COLOR[data.role] ?? ROLE_COLOR.supporting
  return (
    <div
      className="px-3 py-2 rounded-xl border-2 shadow-sm text-center min-w-[90px] max-w-[120px]"
      style={{ backgroundColor: style.bg, borderColor: style.border }}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <p className="text-xs font-bold leading-tight" style={{ color: style.text }}>
        {data.name}
      </p>
      <p className="text-[9px] mt-0.5" style={{ color: style.border }}>
        {style.label}
      </p>
      {data.description && (
        <p className="text-[9px] mt-1 text-gray-500 leading-tight line-clamp-2">
          {data.description}
        </p>
      )}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
}

const NODE_TYPES = { character: CharacterNode }

function buildGraph(characters: Character[]): { nodes: Node[]; edges: Edge[] } {
  const protagonist = characters.find(c => c.role === 'protagonist')
  const antagonists = characters.filter(c => c.role === 'antagonist')
  const supporting = characters.filter(c => c.role === 'supporting')

  const nodes: Node[] = []
  const edges: Edge[] = []

  const CX = 400
  const CY = 240

  // 주인공 — 중앙
  if (protagonist) {
    nodes.push({
      id: protagonist.id,
      type: 'character',
      position: { x: CX, y: CY },
      data: { name: protagonist.name, role: protagonist.role, description: protagonist.description },
    })
  }

  // 빌런 — 위쪽에 배치
  antagonists.forEach((c, i) => {
    const total = antagonists.length
    const spread = 200
    const x = CX + (i - (total - 1) / 2) * spread
    nodes.push({
      id: c.id,
      type: 'character',
      position: { x, y: CY - 160 },
      data: { name: c.name, role: c.role, description: c.description },
    })
    if (protagonist) {
      edges.push({
        id: `e-${protagonist.id}-${c.id}`,
        source: protagonist.id,
        target: c.id,
        label: '적대',
        style: { stroke: '#dc2626', strokeDasharray: '4 3' },
        labelStyle: { fontSize: 10, fill: '#dc2626' },
      })
    }
  })

  // 조연 — 아래쪽 반원 배치
  supporting.forEach((c, i) => {
    const total = supporting.length
    const angle = total === 1
      ? -Math.PI / 2
      : -Math.PI + (Math.PI / (total - 1)) * i
    const R = 180
    const x = CX + R * Math.cos(angle)
    const y = CY + 120 + R * 0.4 * Math.sin(angle)
    nodes.push({
      id: c.id,
      type: 'character',
      position: { x, y },
      data: { name: c.name, role: c.role, description: c.description },
    })
    if (protagonist) {
      edges.push({
        id: `e-${protagonist.id}-${c.id}`,
        source: protagonist.id,
        target: c.id,
        style: { stroke: '#0891b2' },
      })
    }
  })

  return { nodes, edges }
}

export function CharacterMindMapInner({ characters }: { characters: Character[] }) {
  const { nodes, edges } = useMemo(() => buildGraph(characters), [characters])

  const onInit = useCallback(() => {}, [])

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
        <span className="text-4xl">👤</span>
        <p className="text-sm text-center leading-relaxed">
          등록된 인물이 없습니다.<br />
          오른쪽 패널의 <span className="font-medium text-gray-600">인물 관리</span>에서<br />인물을 추가해 주세요.
        </p>
      </div>
    )
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      onInit={onInit}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={20} color="#f0f0f0" />
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}
