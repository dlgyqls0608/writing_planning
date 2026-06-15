'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap, Handle, Position,
  useNodesState, useEdgesState, addEdge,
  type Node, type Edge, type NodeProps, type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { X, UserPlus, Pencil, StickyNote } from 'lucide-react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import type { Character, Document } from '@/types'

// 모듈 레벨 ref — 페이지당 인스턴스 하나이므로 안전
const deleteCallbackRef = { current: null as ((id: string) => void) | null }
const editCallbackRef = { current: null as ((id: string, data: CharacterNodeData) => void) | null }
const deleteNotepadRef = { current: null as ((id: string) => void) | null }
const updateNotepadTextRef = { current: null as ((id: string, text: string) => void) | null }

const ROLE_COLOR: Record<string, { bg: string; border: string; text: string; label: string; mini: string }> = {
  protagonist: { bg: '#ede9fe', border: '#4f46e5', text: '#3730a3', label: '주인공',   mini: '#4f46e5' },
  antagonist:  { bg: '#fee2e2', border: '#dc2626', text: '#991b1b', label: '빌런',     mini: '#dc2626' },
  supporting:  { bg: '#e0f2fe', border: '#0891b2', text: '#0c4a6e', label: '조연',     mini: '#0891b2' },
  helper:      { bg: '#d1fae5', border: '#059669', text: '#065f46', label: '조력자',   mini: '#059669' },
  extra:       { bg: '#fef3c7', border: '#d97706', text: '#92400e', label: '엑스트라', mini: '#d97706' },
}

function getRoleStyle(role: string) {
  return ROLE_COLOR[role] ?? { bg: '#f3f4f6', border: '#6b7280', text: '#374151', label: role, mini: '#6b7280' }
}

type CharacterNodeData = {
  name: string
  role: string
  description?: string
  memo?: string
  isDeceased?: boolean
  [key: string]: unknown
}

function CharacterNode({ id, data }: NodeProps<Node<CharacterNodeData>>) {
  const style = getRoleStyle(data.role)
  const dead = data.isDeceased

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    deleteCallbackRef.current?.(id)
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation()
    editCallbackRef.current?.(id, data)
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
      {/* 삭제 버튼 */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 size-4 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 nodrag"
        title="삭제"
      >
        <X className="size-2.5" />
      </button>
      {/* 편집 버튼 */}
      <button
        onClick={handleEdit}
        className="absolute -top-2 -left-2 size-4 rounded-full bg-[#db2777] text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 nodrag"
        title="편집"
      >
        <Pencil className="size-2.5" />
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
      {data.memo && (
        <p className="text-[9px] mt-1 text-amber-600 leading-tight line-clamp-1 italic">
          📝 {data.memo}
        </p>
      )}
    </div>
  )
}

type NotepadNodeData = { text: string; [key: string]: unknown }

function NotepadNode({ id, data }: NodeProps<Node<NotepadNodeData>>) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(data.text ?? ''))
  const text = String(data.text ?? '')

  return (
    <div className="group relative bg-yellow-50 border-2 border-yellow-300 rounded-xl shadow-md p-2.5 min-w-[160px] max-w-[220px] cursor-grab active:cursor-grabbing">
      <button
        onClick={(e) => { e.stopPropagation(); deleteNotepadRef.current?.(id) }}
        className="absolute -top-2 -right-2 size-4 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 nodrag"
        title="삭제"
      >
        <X className="size-2.5" />
      </button>

      <Handle type="target" position={Position.Top}    id="top"    className="!w-2.5 !h-2.5 !bg-yellow-400 !border-white !opacity-0 hover:!opacity-100 transition-opacity" />
      <Handle type="target" position={Position.Left}   id="left"   className="!w-2.5 !h-2.5 !bg-yellow-400 !border-white !opacity-0 hover:!opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-yellow-400 !border-white !opacity-0 hover:!opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right}  id="right"  className="!w-2.5 !h-2.5 !bg-yellow-400 !border-white !opacity-0 hover:!opacity-100 transition-opacity" />

      {editing ? (
        <textarea
          className="w-full text-xs text-gray-700 bg-transparent outline-none resize-none nodrag nopan leading-relaxed"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            updateNotepadTextRef.current?.(id, draft)
            setEditing(false)
          }}
          onKeyDown={(e) => { if (e.key === 'Escape') { updateNotepadTextRef.current?.(id, draft); setEditing(false) } }}
          autoFocus
          rows={5}
        />
      ) : (
        <p
          className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[60px]"
          onDoubleClick={() => { setDraft(text); setEditing(true) }}
        >
          {text || <span className="text-yellow-500 italic text-[10px]">더블클릭으로 편집</span>}
        </p>
      )}
      <p className="text-[9px] text-yellow-500 mt-1 text-right select-none">📝 메모</p>
    </div>
  )
}

const NODE_TYPES = { character: CharacterNode, notepad: NotepadNode }

function buildGraph(characters: Character[]): { nodes: Node[]; edges: Edge[] } {
  const protagonist = characters.find(c => c.role === 'protagonist')
  const antagonists = characters.filter(c => c.role === 'antagonist')
  const arcChars    = characters.filter(c => c.role !== 'protagonist' && c.role !== 'antagonist')

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
        memo: protagonist.memo,
        isDeceased: protagonist.is_deceased,
      },
    })
  }

  // 적대자: 한 행에 최대 5명, 초과 시 다열로 위로 쌓음
  const MAX_ANT_ROW = 5
  antagonists.forEach((c, i) => {
    const total = antagonists.length
    const rowCount = Math.ceil(total / MAX_ANT_ROW)
    const row = Math.floor(i / MAX_ANT_ROW)
    const col = i % MAX_ANT_ROW
    const perRow = row < rowCount - 1 ? MAX_ANT_ROW : total - (rowCount - 1) * MAX_ANT_ROW
    const spacing = perRow > 1 ? Math.min(220, 880 / (perRow - 1)) : 0
    const x = CX + (col - (perRow - 1) / 2) * spacing
    const y = CY - 200 - (rowCount - 1 - row) * 180
    nodes.push({
      id: c.id,
      type: 'character',
      position: { x, y },
      data: { name: c.name, role: c.role, description: c.description, memo: c.memo, isDeceased: c.is_deceased },
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

  // 서브 인물: 인원 수에 비례해 반지름 확대 (겹침 방지)
  const arcR = Math.max(220, arcChars.length * 55)
  arcChars.forEach((c, i) => {
    const total = arcChars.length
    const frac  = total === 1 ? 0.5 : i / (total - 1)
    const angle = Math.PI + frac * Math.PI
    const x = CX + arcR * Math.cos(angle)
    const y = CY + 100 + Math.abs(arcR * 0.5 * Math.sin(angle))
    nodes.push({
      id: c.id,
      type: 'character',
      position: { x, y },
      data: { name: c.name, role: c.role, description: c.description, memo: c.memo, isDeceased: c.is_deceased },
    })
    if (protagonist) {
      if (c.role === 'supporting') {
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
      } else if (c.role === 'helper') {
        edges.push({
          id: `auto-${protagonist.id}-${c.id}`,
          source: protagonist.id,
          target: c.id,
          label: '조력',
          style: { stroke: '#059669' },
          labelStyle: { fontSize: 10, fill: '#059669', fontWeight: 600 },
          labelBgStyle: { fill: '#f0fdf4', fillOpacity: 0.9 },
          labelBgPadding: [3, 5] as [number, number],
          labelBgBorderRadius: 4,
        })
      }
    }
  })

  // 주인공 없을 때: 원형 배치, 인원 수에 비례해 반지름 확대
  if (!protagonist && characters.length > 0) {
    const R = Math.max(200, characters.length * 40)
    characters.forEach((c, i) => {
      const angle = (2 * Math.PI * i) / characters.length - Math.PI / 2
      nodes.push({
        id: c.id,
        type: 'character',
        position: { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) },
        data: { name: c.name, role: c.role, description: c.description, memo: c.memo, isDeceased: c.is_deceased },
      })
    })
  }

  return { nodes, edges }
}

function loadNotepadNodes(projectId: string): Node[] {
  try { return JSON.parse(localStorage.getItem(`nf-map-notepads-${projectId}`) ?? '[]') } catch { return [] }
}

function saveNotepadNodes(projectId: string, nodes: Node[]) {
  const notepads = nodes.filter(n => n.type === 'notepad')
  try { localStorage.setItem(`nf-map-notepads-${projectId}`, JSON.stringify(notepads)) } catch {}
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

const PRESET_ROLES = ['protagonist', 'antagonist', 'supporting', 'helper', 'extra']

type EditData = {
  name: string
  role: string
  description: string
  memo: string
}

export function CharacterMindMapInner({
  characters,
  projectId,
  charDocs = [],
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated,
}: {
  characters: Character[]
  projectId: string
  charDocs?: Document[]
  onDocumentCreated?: (doc: Document) => void
  onDocumentDeleted?: (docId: string) => void
  onDocumentUpdated?: (docId: string, updates: Partial<Document>) => void
}) {
  const qc = useQueryClient()

  // 추가 폼 상태
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addRole, setAddRole] = useState<string>('supporting')
  const [addCustomRole, setAddCustomRole] = useState('')
  const [addDesc, setAddDesc] = useState('')
  const [addMemo, setAddMemo] = useState('')

  // 편집 패널 상태
  const [editingCharId, setEditingCharId] = useState<string | null>(null)
  const [editData, setEditData] = useState<EditData | null>(null)
  const [editCustomRole, setEditCustomRole] = useState('')

  // ── 뮤테이션 ──────────────────────────────────────────────────────────────

  const deleteCharMutation = useMutation({
    mutationFn: async (id: string) => {
      const char = characters.find(c => c.id === id)
      const res = await fetch(`/api/characters/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제 실패')
      // 연결된 character-card 문서도 함께 삭제
      if (char) {
        const matchingDoc = charDocs.find(d => d.title === char.name)
        if (matchingDoc) {
          await fetch(`/api/documents/${matchingDoc.id}`, { method: 'DELETE' })
          onDocumentDeleted?.(matchingDoc.id)
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['characters', projectId] }),
  })

  const addCharMutation = useMutation({
    mutationFn: async (data: { name: string; role: string; description: string; memo: string }) => {
      const charRes = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, ...data }),
      })
      if (!charRes.ok) throw new Error('추가 실패')
      const char = await charRes.json()

      // character-card 문서도 함께 생성하여 사이드바 동기화
      const docRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, type: 'character-card', title: data.name }),
      })
      if (docRes.ok) {
        const doc = await docRes.json()
        onDocumentCreated?.(doc)
      }

      return char
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['characters', projectId] })
      setAddName(''); setAddDesc(''); setAddMemo(''); setAddCustomRole(''); setAddRole('supporting'); setShowAddForm(false)
    },
  })

  const saveEditMutation = useMutation({
    mutationFn: async (data: EditData & { id: string }) => {
      const res = await fetch(`/api/characters/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, role: data.role, description: data.description, memo: data.memo }),
      })
      if (!res.ok) throw new Error('수정 실패')
      return res.json()
    },
    onSuccess: (updated, variables) => {
      qc.invalidateQueries({ queryKey: ['characters', projectId] })
      // 노드 데이터 즉시 업데이트 (리마운트 없이)
      setNodes(nds => nds.map(n =>
        n.id === updated.id
          ? { ...n, data: { ...n.data, name: updated.name, role: updated.role, description: updated.description, memo: updated.memo } }
          : n
      ))

      // 이름이 변경된 경우 연결 문서 제목도 업데이트 (best-effort)
      const originalChar = characters.find(c => c.id === variables.id)
      if (originalChar && originalChar.name !== variables.name) {
        const matchingDoc = charDocs.find(d => d.title === originalChar.name)
        if (matchingDoc) {
          fetch(`/api/documents/${matchingDoc.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: variables.name }),
          }).then(r => {
            if (r.ok) onDocumentUpdated?.(matchingDoc.id, { title: variables.name })
          }).catch(() => {})
        }
      }

      setEditingCharId(null)
      setEditData(null)
    },
  })

  // 콜백 ref 업데이트 (렌더마다 최신 클로저 유지)
  deleteCallbackRef.current = (id: string) => {
    if (window.confirm('이 인물을 삭제할까요?')) deleteCharMutation.mutate(id)
  }
  deleteNotepadRef.current = (id: string) => {
    setNodes(nds => {
      const next = nds.filter(n => n.id !== id)
      saveNotepadNodes(projectId, next)
      return next
    })
  }
  updateNotepadTextRef.current = (id: string, text: string) => {
    setNodes(nds => {
      const next = nds.map(n => n.id === id ? { ...n, data: { ...n.data, text } } : n)
      saveNotepadNodes(projectId, next)
      return next
    })
  }
  editCallbackRef.current = (id: string, nodeData: CharacterNodeData) => {
    const role = String(nodeData.role ?? 'supporting')
    const isCustom = !PRESET_ROLES.includes(role)
    setEditingCharId(id)
    setEditData({
      name: nodeData.name,
      role: isCustom ? '__custom__' : role,
      description: String(nodeData.description ?? ''),
      memo: String(nodeData.memo ?? ''),
    })
    if (isCustom) setEditCustomRole(role)
    else setEditCustomRole('')
  }

  // ── ReactFlow 상태 ────────────────────────────────────────────────────────

  const initialData = useMemo(() => {
    const { nodes: autoNodes, edges: autoEdges } = buildGraph(characters)
    const savedPos = loadPositions(projectId)
    const charNodes = autoNodes.map(n =>
      savedPos[n.id] ? { ...n, position: savedPos[n.id] } : n
    )
    const notepadNodes = loadNotepadNodes(projectId)
    const customEdges = loadCustomEdges(projectId)
    return { nodes: [...charNodes, ...notepadNodes], edges: [...autoEdges, ...customEdges] }
  }, [characters, projectId])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges)

  // 마운트 후 characters prop 변경 시 전체 리마운트 없이 노드/엣지를 점진적으로 동기화
  const isFirstSync = useRef(true)
  useEffect(() => {
    if (isFirstSync.current) {
      isFirstSync.current = false
      return
    }
    const { nodes: defaultNodes, edges: newAutoEdges } = buildGraph(characters)
    const savedPos = loadPositions(projectId)

    setNodes(prev => {
      const notepadNodes = prev.filter(n => n.type === 'notepad')
      const prevCharNodes = prev.filter(n => n.type === 'character')
      const prevCharIdSet = new Set(prevCharNodes.map(n => n.id))
      const newCharIdSet  = new Set(characters.map(c => c.id))

      // 기존 노드: 삭제된 인물 제거 + 데이터 갱신
      const retained = prevCharNodes
        .filter(n => newCharIdSet.has(n.id))
        .map(n => {
          const char = characters.find(c => c.id === n.id)!
          return {
            ...n,
            data: {
              name: char.name,
              role: char.role,
              description: char.description ?? '',
              memo: char.memo ?? '',
              isDeceased: char.is_deceased ?? false,
            },
          }
        })

      // 새로 추가된 인물 노드 생성
      const added: Node[] = characters
        .filter(c => !prevCharIdSet.has(c.id))
        .map(c => {
          const defaultNode = defaultNodes.find(n => n.id === c.id)
          return {
            id: c.id,
            type: 'character' as const,
            position: savedPos[c.id] ?? defaultNode?.position ?? {
              x: 250 + Math.random() * 300,
              y: 180 + Math.random() * 250,
            },
            data: {
              name: c.name,
              role: c.role,
              description: c.description ?? '',
              memo: c.memo ?? '',
              isDeceased: c.is_deceased ?? false,
            },
          }
        })

      return [...retained, ...added, ...notepadNodes]
    })

    // 자동 엣지 재계산, 커스텀 엣지 유지
    setEdges(prev => {
      const customEdges = prev.filter(e => e.id.startsWith('custom-'))
      return [...newAutoEdges, ...customEdges]
    })
  }, [characters, projectId])

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

  const onEdgeContextMenu = useCallback(
    (e: React.MouseEvent, edge: Edge) => {
      e.preventDefault()
      if (window.confirm('이 연결선을 삭제할까요?')) {
        setEdges(eds => {
          const next = eds.filter(e2 => e2.id !== edge.id)
          saveCustomEdges(projectId, next)
          return next
        })
      }
    },
    [setEdges, projectId],
  )

  function addNotepad() {
    const id = `notepad-${Date.now()}`
    const newNode: Node = {
      id,
      type: 'notepad',
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 150 },
      data: { text: '' },
    }
    setNodes(nds => {
      const next = [...nds, newNode]
      saveNotepadNodes(projectId, next)
      return next
    })
  }

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

  // ReactFlow가 전달하는 currentNodes를 사용해 stale closure 방지
  const onNodeDragStop = useCallback((_: MouseEvent | TouchEvent, __: Node, currentNodes: Node[]) => {
    savePositions(projectId, currentNodes)
    saveNotepadNodes(projectId, currentNodes)
  }, [projectId])

  // ── 패널 UI ───────────────────────────────────────────────────────────────

  const editPanel = editingCharId && editData ? (
    <div className="absolute top-4 right-4 z-20 w-60 bg-white rounded-xl border border-pink-200 shadow-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#db2777] flex items-center gap-1">
          <Pencil className="size-3.5" /> 인물 수정
        </p>
        <button
          onClick={() => { setEditingCharId(null); setEditData(null) }}
          className="text-gray-400 hover:text-gray-600 nodrag"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <input
        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#db2777]"
        placeholder="이름 *"
        value={editData.name}
        onChange={(e) => setEditData(prev => prev ? { ...prev, name: e.target.value } : null)}
      />
      <select
        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#db2777]"
        value={editData.role}
        onChange={(e) => setEditData(prev => prev ? { ...prev, role: e.target.value } : null)}
      >
        <option value="protagonist">주인공</option>
        <option value="antagonist">빌런/적대자</option>
        <option value="supporting">조연</option>
        <option value="helper">조력자</option>
        <option value="extra">엑스트라</option>
        <option value="__custom__">직접 입력...</option>
      </select>
      {editData.role === '__custom__' && (
        <input
          className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#db2777]"
          placeholder="역할 이름 입력 (예: 내레이터, 조언자)"
          value={editCustomRole}
          onChange={(e) => setEditCustomRole(e.target.value)}
        />
      )}
      <input
        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#db2777]"
        placeholder="설명 (선택)"
        value={editData.description}
        onChange={(e) => setEditData(prev => prev ? { ...prev, description: e.target.value } : null)}
      />
      <textarea
        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#db2777] resize-none"
        placeholder="메모 (선택) — 작가 노트, 관계 힌트 등"
        rows={3}
        value={editData.memo}
        onChange={(e) => setEditData(prev => prev ? { ...prev, memo: e.target.value } : null)}
      />
      <div className="flex gap-1.5 justify-end">
        <button
          onClick={() => { setEditingCharId(null); setEditData(null) }}
          className="text-xs px-2 py-1 rounded text-gray-500 hover:bg-gray-100"
        >취소</button>
        <button
          onClick={() => {
            if (!editData.name.trim() || !editingCharId) return
            const actualRole = editData.role === '__custom__' ? editCustomRole.trim() : editData.role
            if (!actualRole) return
            saveEditMutation.mutate({ id: editingCharId, ...editData, role: actualRole, name: editData.name.trim() })
          }}
          disabled={!editData.name.trim() || saveEditMutation.isPending || (editData.role === '__custom__' && !editCustomRole.trim())}
          className="text-xs px-2 py-1 rounded bg-[#db2777] text-white disabled:opacity-50"
        >
          {saveEditMutation.isPending ? '저장 중...' : '저장'}
        </button>
      </div>
      {saveEditMutation.isError && (
        <p className="text-[10px] text-red-500">수정에 실패했습니다.</p>
      )}
    </div>
  ) : null

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
          if (e.key === 'Enter' && addName.trim())
            addCharMutation.mutate({ name: addName.trim(), role: addRole, description: addDesc.trim(), memo: addMemo.trim() })
        }}
        autoFocus
      />
      <select
        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#db2777]"
        value={addRole}
        onChange={(e) => setAddRole(e.target.value)}
      >
        <option value="protagonist">주인공</option>
        <option value="antagonist">빌런/적대자</option>
        <option value="supporting">조연</option>
        <option value="helper">조력자</option>
        <option value="extra">엑스트라</option>
        <option value="__custom__">직접 입력...</option>
      </select>
      {addRole === '__custom__' && (
        <input
          className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#db2777]"
          placeholder="역할 이름 입력 (예: 내레이터, 조언자)"
          value={addCustomRole}
          onChange={(e) => setAddCustomRole(e.target.value)}
        />
      )}
      <input
        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#db2777]"
        placeholder="설명 (선택)"
        value={addDesc}
        onChange={(e) => setAddDesc(e.target.value)}
      />
      <textarea
        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#db2777] resize-none"
        placeholder="메모 (선택)"
        rows={2}
        value={addMemo}
        onChange={(e) => setAddMemo(e.target.value)}
      />
      <div className="flex gap-1.5 justify-end">
        <button
          onClick={() => { setShowAddForm(false); setAddName(''); setAddDesc(''); setAddMemo(''); setAddCustomRole('') }}
          className="text-xs px-2 py-1 rounded text-gray-500 hover:bg-gray-100"
        >취소</button>
        <button
          onClick={() => {
            if (!addName.trim()) return
            const actualRole = addRole === '__custom__' ? addCustomRole.trim() : addRole
            if (!actualRole) return
            addCharMutation.mutate({ name: addName.trim(), role: actualRole, description: addDesc.trim(), memo: addMemo.trim() })
          }}
          disabled={!addName.trim() || addCharMutation.isPending || (addRole === '__custom__' && !addCustomRole.trim())}
          className="text-xs px-2 py-1 rounded bg-[#db2777] text-white disabled:opacity-50"
        >
          {addCharMutation.isPending ? '추가 중...' : '추가'}
        </button>
      </div>
      {addCharMutation.isError && (
        <p className="text-[10px] text-red-500">추가에 실패했습니다.</p>
      )}
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
        <button
          onClick={addNotepad}
          className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-400 text-yellow-900 text-xs font-medium shadow-lg hover:bg-yellow-500 transition-colors"
        >
          <StickyNote className="size-3.5" />
          메모 추가
        </button>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%' }} className="relative">
      {/* 조작 안내 */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1 text-[10px] text-gray-500 pointer-events-none shadow-sm">
        <span>드래그로 이동</span>
        <span className="w-px h-3 bg-gray-300" />
        <span>핑크 버튼 → 편집</span>
        <span className="w-px h-3 bg-gray-300" />
        <span>가장자리 드래그 → 연결</span>
        <span className="w-px h-3 bg-gray-300" />
        <span>연결선 더블클릭 → 라벨</span>
        <span className="w-px h-3 bg-gray-300" />
        <span>연결선 우클릭 → 삭제</span>
      </div>

      {/* 메모 추가 버튼 */}
      <button
        onClick={addNotepad}
        className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-400 text-yellow-900 text-xs font-medium shadow-lg hover:bg-yellow-500 transition-colors"
      >
        <StickyNote className="size-3.5" />
        메모 추가
      </button>

      {editPanel}
      {addCharPanel}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onEdgeContextMenu={onEdgeContextMenu}
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
