'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap, Handle, Position,
  useNodesState, useEdgesState, addEdge,
  type Node, type Edge, type NodeProps, type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { X, UserPlus } from 'lucide-react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import type { Character } from '@/types'

const deleteCallbackRef = { current: null as ((id: string) => void) | null }

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

function CharacterNode({ id, data }: NodeProps<Node<CharacterNodeData>>) {
  const style = ROLE_COLOR[data.role as keyof typeof ROLE_COLOR] ?? ROLE_COLOR.supporting
  const dead = data.isDeceased

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    deleteCallbackRef.current?.(id)
  }

  return (
    <div
      className="group relative px-3 py-2 rounded-xl border-2 shadow-sm text-center min-w-[100px] max-w-[140px] cursor-grab active:cursor-grabbing"
      style={{
        backgroundColor: dead ? '#f3f4f6' : style.bg,
        borderColor: dead ? '#9ca3af' : style.border,
        opacity: dead ? 0.65 : 1,
      }}
    >
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 size-4 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 nodrag"
        title="삭제"
      >
        <X className="size-2.5" />
      </button>
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
  const qc = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addRole, setAddRole] = useState<'protagonist' | 'antagonist' | 'supporting'>('supporting')
  const [addDesc, setAddDesc] = useState('')

  const deleteCharMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/characters/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제 실패')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['characters', projectId] }),
  })

  const addCharMutation = useMutation({
    mutationFn: async (data: { name: string; role: string; description: string }) => {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, ...data }),
      })
      if (!res.ok) throw new Error('추가 실패')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['characters', projectId] })
      setAddName('')
      setAddDesc('')
      setShowAddForm(false)
    },
  })

  deleteCallbackRef.current = (id: string) => {
    if (window.confirm('이 인물을 삭제할까요?')) {
      deleteCharMutation.mutate(id)
    }
  }

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

  const addCharPanel = showAddForm ? (
    <div className="absolute bottom-4 right-4 z-10 w-52 bg-white rounded-xl border border-pink-200 shadow-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-[#db2777] flex items-center gap-1">
        <UserPlus className="size-3.5" /> 인물 추가
      </p>
      <input
        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#db2777]"
        placeholder="이름 *"
        value={addName}
        onChange={(e) => setAddName(e.target.value)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return
          if (e.key === 'Enter' && addName.trim()) addCharMutation.mutate({ name: addName.trim(), role: addRole, description: addDesc.trim() })
        }}
        autoFocus
      />
      <select
        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#db2777]"
        value={addRole}
        onChange={(e) => setAddRole(e.target.value as typeof addRole)}
      >
        <option value="protagonist">주인공</option>
        <option value="antagonist">빌런/적대자</option>
        <option value="supporting">조연</option>
      </select>
      <input
        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#db2777]"
        placeholder="설명 (선택)"
        value={addDesc}
        onChange={(e) => setAddDesc(e.target.value)}
      />
      <div className="flex gap-1.5 justify-end">
        <button
          onClick={() => { setShowAddForm(false); setAddName(''); setAddDesc('') }}
          className="text-xs px-2 py-1 rounded text-gray-500 hover:bg-gray-100"
        >취소</button>
        <button
          onClick={() => {
            if (!addName.trim()) return
            addCharMutation.mutate({ name: addName.trim(), role: addRole, description: addDesc.trim() })
          }}
          disabled={!addName.trim() || addCharMutation.isPending}
          className="text-xs px-2 py-1 rounded bg-[#db2777] text-white disabled:opacity-50"
        >추가</button>
      </div>
    </div>
  ) : (
    <button
      onClick={() => setShowAddForm(true)}
      className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#db2777] text-white text-xs font-medium shadow-lg hover:bg-pink-700 transition-colors"
    >
      <UserPlus className="size-3.5" />
      인물 추가
    </button>
  )

  if (characters.length === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full gap-3 text-gray-400">
        <span className="text-4xl">👤</span>
        <p className="text-sm text-center leading-relaxed">
          등록된 인물이 없습니다.<br />
          아래 버튼으로 바로 추가할 수 있어요.
        </p>
        {addCharPanel}
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

      {addCharPanel}

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
