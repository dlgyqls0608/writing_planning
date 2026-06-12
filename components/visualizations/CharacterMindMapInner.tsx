'use client'

import { useCallback, useMemo } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap, Handle, Position,
  useNodesState, useEdgesState, addEdge,
  type Node, type Edge, type NodeProps, type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Character } from '@/types'

const ROLE_COLOR = {
  protagonist: { bg: '#ede9fe', border: '#4f46e5', text: '#3730a3', label: '주인공', mini: '#4f46e5' },
  antagonist:  { bg: '#fee2e2', border: '#dc2626', text: '#991b1b', label: '빌런',   mini: '#dc2626' },
  supporting:  { bg: '#e0f2fe', border: '#0891b2', text: '#0c4a6e', label: '조연',   mini: '#0891b2' },
} as const

type CharacterNodeData = {
  name: string
  role: string
  description?: string
  isDeceased?: boolean
  [key: string]: unknown
}

function CharacterNode({ data }: NodeProps<Node<CharacterNodeData>>) {
  const style = ROLE_COLOR[data.role as keyof typeof ROLE_COLOR] ?? ROLE_COLOR.supporting
  const dead = data.isDeceased

  return (
    <div
      className="px-3 py-2 rounded-xl border-2 shadow-sm text-center min-w-[100px] max-w-[140px] cursor-grab active:cursor-grabbing"
      style={{
        backgroundColor: dead ? '#f3f4f6' : style.bg,
        borderColor: dead ? '#9ca3af' : style.border,
        opacity: dead ? 0.65 : 1,
      }}
    >
      {/* 4방향 연결 핸들 — 호버 시 표시 */}
      <Handle type="target" position={Position.Top}    id="top"    className="!w-2.5 !h-2.5 !bg-gray-400 !border-white !opacity-0 hover:!opacity-100 transition-opacity" />
      <Handle type="target" position={Position.Left}   id="left"   className="!w-2.5 !h-2.5 !bg-gray-400 !border-white !opacity-0 hover:!opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-gray-400 !border-white !opacity-0 hover:!opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right}  id="right"  className="!w-2.5 !h-2.5 !bg-gray-400 !border-white !opacity-0 hover:!opacity-100 transition-opacity" />

      <p className="text-xs font-bold leading-tight" style={{ color: dead ? '#6b7280' : style.text }}>
        {dead ? '💀 ' : ''}{data.name}
      </p>
      <p className="text-[9px] mt-0.5" style={{ color: dead ? '#9ca3af' : style.border }}>
        {dead ? '사망' : style.label}
      </p>
      {data.description && (
        <p className="text-[9px] mt-1 text-gray-500 leading-tight line-clamp-2">
          {data.description}
        </p>
      )}
    </div>
  )
}

const NODE_TYPES = { character: CharacterNode }

function buildGraph(characters: Character[]): { nodes: Node[]; edges: Edge[] } {
  const protagonist = characters.find(c => c.role === 'protagonist')
  const antagonists = characters.filter(c => c.role === 'antagonist')
  const supporting  = characters.filter(c => c.role === 'supporting')

  const nodes: Node[] = []
  const edges: Edge[] = []

  const CX = 380
  const CY = 260

  if (protagonist) {
    nodes.push({
      id: protagonist.id,
      type: 'character',
      position: { x: CX, y: CY },
      data: {
        name: protagonist.name,
        role: protagonist.role,
        description: protagonist.description,
        isDeceased: protagonist.is_deceased,
      },
    })
  }

  antagonists.forEach((c, i) => {
    const total = antagonists.length
    const x = CX + (i - (total - 1) / 2) * 240
    nodes.push({
      id: c.id,
      type: 'character',
      position: { x, y: CY - 190 },
      data: { name: c.name, role: c.role, description: c.description, isDeceased: c.is_deceased },
    })
    if (protagonist) {
      edges.push({
        id: `auto-${protagonist.id}-${c.id}`,
        source: protagonist.id,
        target: c.id,
        label: '적대',
        style: { stroke: '#dc2626', strokeDasharray: '5 3' },
        labelStyle: { fontSize: 10, fill: '#dc2626', fontWeight: 600 },
        labelBgStyle: { fill: '#fff5f5', fillOpacity: 0.9 },
        labelBgPadding: [3, 5] as [number, number],
        labelBgBorderRadius: 4,
      })
    }
  })

  supporting.forEach((c, i) => {
    const total = supporting.length
    const frac  = total === 1 ? 0.5 : i / (total - 1)
    const angle = Math.PI + frac * Math.PI
    const R = 210
    const x = CX + R * Math.cos(angle)
    const y = CY + 90 + Math.abs(R * 0.45 * Math.sin(angle))
    nodes.push({
      id: c.id,
      type: 'character',
      position: { x, y },
      data: { name: c.name, role: c.role, description: c.description, isDeceased: c.is_deceased },
    })
    if (protagonist) {
      edges.push({
        id: `auto-${protagonist.id}-${c.id}`,
        source: protagonist.id,
        target: c.id,
        label: '동료',
        style: { stroke: '#0891b2' },
        labelStyle: { fontSize: 10, fill: '#0891b2', fontWeight: 600 },
        labelBgStyle: { fill: '#f0f9ff', fillOpacity: 0.9 },
        labelBgPadding: [3, 5] as [number, number],
        labelBgBorderRadius: 4,
      })
    }
  })

  // 주인공 없을 때: 캐릭터들을 원형 배치
  if (!protagonist && characters.length > 0) {
    characters.forEach((c, i) => {
      const angle = (2 * Math.PI * i) / characters.length - Math.PI / 2
      const R = 200
      nodes.push({
        id: c.id,
        type: 'character',
        position: { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) },
        data: { name: c.name, role: c.role, description: c.description, isDeceased: c.is_deceased },
      })
    })
  }

  return { nodes, edges }
}

function loadPositions(projectId: string): Record<string, { x: number; y: number }> {
  try { return JSON.parse(localStorage.getItem(`nf-map-pos-${projectId}`) ?? '{}') } catch { return {} }
}

function loadCustomEdges(projectId: string): Edge[] {
  try { return JSON.parse(localStorage.getItem(`nf-map-edges-${projectId}`) ?? '[]') } catch { return [] }
}

function savePositions(projectId: string, nodes: Node[]) {
  const pos: Record<string, { x: number; y: number }> = {}
  nodes.forEach(n => { pos[n.id] = n.position })
  try { localStorage.setItem(`nf-map-pos-${projectId}`, JSON.stringify(pos)) } catch {}
}

function saveCustomEdges(projectId: string, edges: Edge[]) {
  const custom = edges.filter(e => e.id.startsWith('custom-'))
  try { localStorage.setItem(`nf-map-edges-${projectId}`, JSON.stringify(custom)) } catch {}
}

export function CharacterMindMapInner({
  characters,
  projectId,
}: {
  characters: Character[]
  projectId: string
}) {
  const initialData = useMemo(() => {
    const { nodes: autoNodes, edges: autoEdges } = buildGraph(characters)
    const savedPos  = loadPositions(projectId)
    const nodes = autoNodes.map(n =>
      savedPos[n.id] ? { ...n, position: savedPos[n.id] } : n
    )
    const customEdges = loadCustomEdges(projectId)
    return { nodes, edges: [...autoEdges, ...customEdges] }
  }, [characters, projectId])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges)

  const onConnect = useCallback(
    (connection: Connection) => {
      const label = window.prompt('관계 이름을 입력하세요 (예: 친구, 라이벌, 연인):', '관계') ?? '관계'
      const newEdge: Edge = {
        id: `custom-${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
        label,
        style: { stroke: '#6b7280' },
        labelStyle: { fontSize: 10, fill: '#374151', fontWeight: 600 },
        labelBgStyle: { fill: '#f9fafb', fillOpacity: 0.9 },
        labelBgPadding: [3, 5] as [number, number],
        labelBgBorderRadius: 4,
      }
      setEdges(eds => {
        const next = addEdge(newEdge, eds)
        saveCustomEdges(projectId, next)
        return next
      })
    },
    [setEdges, projectId],
  )

  const onEdgeDoubleClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const label = window.prompt('관계 이름 수정:', String(edge.label ?? ''))
      if (label === null) return
      setEdges(eds => {
        const next = eds.map(e => e.id === edge.id ? { ...e, label } : e)
        saveCustomEdges(projectId, next)
        return next
      })
    },
    [setEdges, projectId],
  )

  const onNodeDragStop = useCallback(() => {
    savePositions(projectId, nodes)
  }, [nodes, projectId])

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
    <div style={{ width: '100%', height: '100%' }} className="relative">
      {/* 조작 안내 */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1 text-[10px] text-gray-500 pointer-events-none shadow-sm">
        <span>드래그로 이동</span>
        <span className="w-px h-3 bg-gray-300" />
        <span>노드 가장자리 → 드래그로 관계 연결</span>
        <span className="w-px h-3 bg-gray-300" />
        <span>연결선 더블클릭으로 라벨 수정</span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
      >
        <Background gap={20} color="#f0f0f0" />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const role = (n.data as CharacterNodeData).role
            return ROLE_COLOR[role as keyof typeof ROLE_COLOR]?.mini ?? '#9ca3af'
          }}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  )
}
