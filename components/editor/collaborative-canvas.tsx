'use client';

import { Component, ErrorInfo, ReactNode, useRef, useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionMode,
  useReactFlow,
  ReactFlowProvider,
  NodeProps,
  Handle,
  Position,
  NodeResizer,
  useNodes,
  useEdges,
  SelectionMode,
  reconnectEdge,
  Edge,
  Connection,
} from '@xyflow/react';
import { ClientSideSuspense, useHistory, useMyPresence } from '@liveblocks/react';
import { LiveCursorsLayer } from './live-cursors-layer';
import { useLiveblocksFlow } from '@liveblocks/react-flow';
import { Square, Diamond, Circle, Hexagon, Database, Pill, ZoomIn, ZoomOut, Maximize, Undo2, Redo2, MousePointer2, Hand } from 'lucide-react';
import { CanvasNode, NodeShape, NODE_COLORS } from '@/types/canvas';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useEditorActions } from '@/hooks/use-editor-actions';
import { cn } from '@/lib/utils';
import { StarterTemplatesModal } from './starter-templates-modal';
import { CanvasTemplate } from './starter-templates';
import { useCanvasAutosave } from '@/hooks/use-canvas-autosave';
import { CanvasEdge } from './canvas-edge';

// React Flow v12 Core Styles
import '@xyflow/react/dist/style.css';

// Client-side unique node ID counter
let nodeCounter = 0;

// ── Canvas Error Boundary ──
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CanvasErrorBoundary] Uncaught connection error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ── Shape Renderer Component ──
interface ShapeRendererProps {
  shape: NodeShape;
  color: string;
  isSelected?: boolean;
  label?: string;
  isEditing?: boolean;
  editedLabel?: string;
  onChangeLabel?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlurLabel?: () => void;
  onKeyDownLabel?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  onDoubleClickLabel?: (e: React.MouseEvent) => void;
}

export function ShapeRenderer({
  shape,
  color,
  isSelected = false,
  label = '',
  isEditing = false,
  editedLabel = '',
  onChangeLabel,
  onBlurLabel,
  onKeyDownLabel,
  textareaRef,
  onDoubleClickLabel,
}: ShapeRendererProps) {
  const colorPair = Object.values(NODE_COLORS).find(
    (c) => c.fill.toLowerCase() === color.toLowerCase()
  ) || NODE_COLORS.neutral;
  const textColor = colorPair.text;

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="w-full flex items-center justify-center z-10 h-full p-1">
          <textarea
            ref={textareaRef}
            value={editedLabel}
            onChange={onChangeLabel}
            onBlur={onBlurLabel}
            onKeyDown={onKeyDownLabel}
            placeholder="Double-click to edit"
            className="nodrag nopan w-full bg-transparent text-center text-sm font-medium border-none outline-none resize-none overflow-hidden focus:ring-0 p-0 h-auto leading-relaxed select-text"
            rows={2}
            style={{
              color: textColor,
              overflow: 'hidden',
            }}
          />
        </div>
      );
    }

    const isPlaceholder = !label;
    return (
      <span
        onDoubleClick={onDoubleClickLabel}
        style={{ color: isPlaceholder ? undefined : textColor }}
        className={`text-sm text-center truncate px-4 z-10 w-full select-none cursor-text ${
          isPlaceholder ? 'text-text-muted/50 italic font-normal' : 'font-medium'
        }`}
      >
        {label || 'Double-click to edit'}
      </span>
    );
  };

  // CSS Shapes: rectangle, pill, circle
  if (shape === 'rectangle' || shape === 'pill' || shape === 'circle') {
    let borderRadiusClass = 'rounded-xl';
    if (shape === 'pill' || shape === 'circle') {
      borderRadiusClass = 'rounded-full';
    }

    return (
      <div
        style={{
          backgroundColor: color,
          borderColor: isSelected ? textColor : 'var(--border-default)',
          borderWidth: '1.5px',
        }}
        className={`relative h-full w-full flex items-center justify-center p-3 select-none ${borderRadiusClass} border transition-all`}
      >
        {renderContent()}
      </div>
    );
  }

  // SVG Shapes: diamond, hexagon, cylinder
  let svgContent = null;
  if (shape === 'diamond') {
    svgContent = (
      <polygon
        points="50,0 100,50 50,100 0,50"
        fill={color}
        stroke={isSelected ? textColor : 'var(--border-default)'}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    );
  } else if (shape === 'hexagon') {
    svgContent = (
      <polygon
        points="25,0 75,0 100,50 75,100 25,100 0,50"
        fill={color}
        stroke={isSelected ? textColor : 'var(--border-default)'}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    );
  } else if (shape === 'cylinder') {
    svgContent = (
      <>
        <path
          d="M 0,15 A 50,15 0 0 1 100,15 V 85 A 50,15 0 0 1 0,85 Z"
          fill={color}
          stroke={isSelected ? textColor : 'var(--border-default)'}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
        <ellipse
          cx="50"
          cy="15"
          rx="50"
          ry="15"
          fill={color}
          stroke={isSelected ? textColor : 'var(--border-default)'}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      </>
    );
  }

  return (
    <div className="relative h-full w-full flex items-center justify-center p-3 select-none">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
        className="absolute inset-0 -z-10 pointer-events-none"
      >
        {svgContent}
      </svg>
      {renderContent()}
    </div>
  );
}

// Inline style applied to every connection Handle.
// Inline styles beat any external stylesheet (including React Flow's own CSS),
// so this is the only reliable way to ensure handles are fully invisible.
const HANDLE_STYLE: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderRadius: 0,
  width: 10,
  height: 10,
  minWidth: 0,
  minHeight: 0,
};

// ── Custom Canvas Node Renderer ──
export function CustomCanvasNodeRenderer({ id, data, selected }: NodeProps<CanvasNode>) {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState(data.label || '');
  const [hoveredColorKey, setHoveredColorKey] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync state with incoming collaborative data changes
  useEffect(() => {
    setEditedLabel(data.label || '');
  }, [data.label]);

  // Focus and select the text when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const updateLabel = (newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
            },
          };
        }
        return node;
      })
    );
  };

  const handleColorChange = (newColor: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              color: newColor,
            },
          };
        }
        return node;
      })
    );
  };

  const onChangeLabel = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditedLabel(val);
    updateLabel(val);
  };

  const onBlurLabel = () => {
    setIsEditing(false);
  };

  const onKeyDownLabel = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const onDoubleClickLabel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  return (
    <div className="group relative h-full w-full">
      {/* Subtle Resize Handles - visible only when active node is selected */}
      <NodeResizer
        isVisible={!!selected}
        minWidth={60}
        minHeight={40}
        keepAspectRatio={data.shape === 'circle' || data.shape === 'diamond' || data.shape === 'hexagon'}
        handleClassName="!bg-bg-elevated !border !border-border-subtle !w-2.5 !h-2.5 !rounded-full hover:!bg-accent-primary hover:!border-accent-primary transition-colors cursor-se-resize"
        lineClassName="!border-accent-primary/20"
      />

      {/* Floating Color Toolbar - visible only when active node is selected */}
      {selected && (
        <div 
          className="nodrag nopan absolute -top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1 rounded-full border border-border-default bg-bg-surface/95 shadow-xl backdrop-blur-md"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {Object.entries(NODE_COLORS).map(([key, { fill, text }]) => {
            const isActive = (data.color || '#1F1F1F').toLowerCase() === fill.toLowerCase();
            const isHovered = hoveredColorKey === key;
            
            return (
              <button
                key={key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleColorChange(fill);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseEnter={() => setHoveredColorKey(key)}
                onMouseLeave={() => setHoveredColorKey(null)}
                className={`nodrag nopan w-5 h-5 rounded-full transition-all relative flex items-center justify-center cursor-pointer ${
                  isActive ? 'border-2' : 'border border-border-subtle hover:border-border-default'
                }`}
                style={{
                  backgroundColor: fill,
                  borderColor: isActive ? text : undefined,
                  boxShadow: isHovered ? `0 0 6px 1px ${text}` : undefined,
                }}
              >
                {isActive && (
                  <span 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: text }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      <ShapeRenderer
        shape={data.shape || 'rectangle'}
        color={data.color || '#1F1F1F'}
        isSelected={selected}
        label={data.label || ''}
        isEditing={isEditing}
        editedLabel={editedLabel}
        onChangeLabel={onChangeLabel}
        onBlurLabel={onBlurLabel}
        onKeyDownLabel={onKeyDownLabel}
        textareaRef={textareaRef}
        onDoubleClickLabel={onDoubleClickLabel}
      />

      {/* Connection handles — invisible 10px hit-targets on all four sides.
          Inline style always beats React Flow's own stylesheet — no dot rendered. */}

      {/* Top */}
      <Handle type="target" position={Position.Top} id="top"
        style={HANDLE_STYLE} className="!-top-[5px] cursor-crosshair z-20" />
      <Handle type="source" position={Position.Top} id="top"
        style={HANDLE_STYLE} className="!-top-[5px] cursor-crosshair z-20" />

      {/* Right */}
      <Handle type="target" position={Position.Right} id="right"
        style={HANDLE_STYLE} className="!-right-[5px] cursor-crosshair z-20" />
      <Handle type="source" position={Position.Right} id="right"
        style={HANDLE_STYLE} className="!-right-[5px] cursor-crosshair z-20" />

      {/* Bottom */}
      <Handle type="target" position={Position.Bottom} id="bottom"
        style={HANDLE_STYLE} className="!-bottom-[5px] cursor-crosshair z-20" />
      <Handle type="source" position={Position.Bottom} id="bottom"
        style={HANDLE_STYLE} className="!-bottom-[5px] cursor-crosshair z-20" />

      {/* Left */}
      <Handle type="target" position={Position.Left} id="left"
        style={HANDLE_STYLE} className="!-left-[5px] cursor-crosshair z-20" />
      <Handle type="source" position={Position.Left} id="left"
        style={HANDLE_STYLE} className="!-left-[5px] cursor-crosshair z-20" />
    </div>
  );
}

// Custom Node Types Registry for React Flow
const nodeTypes = {
  canvasNode: CustomCanvasNodeRenderer,
};

// Custom Edge Types Registry for React Flow
const edgeTypes = {
  canvasEdge: CanvasEdge,
};

// ── Draggable Shape Panel ──
interface ShapeItem {
  shape: NodeShape;
  label: string;
  icon: React.ComponentType<any>;
  width: number;
  height: number;
}

const SHAPES: ShapeItem[] = [
  { shape: 'rectangle', label: 'Rectangle', icon: Square, width: 120, height: 60 },
  { shape: 'diamond', label: 'Decision', icon: Diamond, width: 100, height: 100 },
  { shape: 'circle', label: 'Event', icon: Circle, width: 80, height: 80 },
  { shape: 'pill', label: 'Service', icon: Pill, width: 120, height: 50 },
  { shape: 'cylinder', label: 'Database', icon: Database, width: 80, height: 100 },
  { shape: 'hexagon', label: 'External', icon: Hexagon, width: 100, height: 100 },
];

interface ShapePanelProps {
  canvasMode: 'pointer' | 'hand';
  onChangeCanvasMode: (mode: 'pointer' | 'hand') => void;
}

function ShapePanel({ canvasMode, onChangeCanvasMode }: ShapePanelProps) {
  const onDragStart = (event: React.DragEvent, shape: NodeShape, width: number, height: number) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ shape, width, height }));
    event.dataTransfer.effectAllowed = 'move';

    const previewEl = document.getElementById(`drag-preview-${shape}`);
    if (previewEl) {
      event.dataTransfer.setDragImage(previewEl, width / 2, height / 2);
    }
  };

  return (
    <>
      {/* Hidden drag previews container */}
      <div className="fixed top-[-5000px] left-[-5000px] pointer-events-none z-0" aria-hidden="true">
        {SHAPES.map((item) => (
          <div
            key={`preview-${item.shape}`}
            id={`drag-preview-${item.shape}`}
            style={{ width: item.width, height: item.height }}
            className="opacity-70 bg-transparent select-none pointer-events-none"
          >
            <ShapeRenderer
              shape={item.shape}
              color="#1F1F1F"
              isSelected={false}
              label=""
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full border border-border-default bg-bg-surface/90 shadow-2xl backdrop-blur-md">
        {SHAPES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.shape}
              draggable
              onDragStart={(e) => onDragStart(e, item.shape, item.width, item.height)}
              className="group flex flex-col items-center justify-center w-12 h-12 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-subtle cursor-grab active:cursor-grabbing transition-all select-none relative"
              title={item.label}
            >
              <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="absolute -top-10 px-2 py-1 rounded bg-bg-surface border border-border-default text-[10px] text-text-primary opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md whitespace-nowrap z-50">
                {item.label}
              </span>
            </div>
          );
        })}

        {/* Vertical Divider */}
        <div className="w-[1px] h-6 bg-border-subtle mx-1" />

        {/* Pointer/Selection Tool */}
        <button
          onClick={() => onChangeCanvasMode('pointer')}
          className={cn(
            "group flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all select-none relative cursor-pointer border border-transparent",
            canvasMode === 'pointer' 
              ? "text-accent-primary bg-accent-primary-dim border border-accent-primary/20" 
              : "text-text-muted hover:text-text-primary hover:bg-bg-subtle"
          )}
          title="Selection Tool (V)"
        >
          <MousePointer2 className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="absolute -top-10 px-2 py-1 rounded bg-bg-surface border border-border-default text-[10px] text-text-primary opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md whitespace-nowrap z-50">
            Selection Tool (V)
          </span>
        </button>

        {/* Hand/Pan Tool */}
        <button
          onClick={() => onChangeCanvasMode('hand')}
          className={cn(
            "group flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all select-none relative cursor-pointer border border-transparent",
            canvasMode === 'hand' 
              ? "text-accent-primary bg-accent-primary-dim border border-accent-primary/20" 
              : "text-text-muted hover:text-text-primary hover:bg-bg-subtle"
          )}
          title="Pan Tool (H)"
        >
          <Hand className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="absolute -top-10 px-2 py-1 rounded bg-bg-surface border border-border-default text-[10px] text-text-primary opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md whitespace-nowrap z-50">
            Pan Tool (H)
          </span>
        </button>
      </div>
    </>
  );
}

// ── Inner Collaborative Canvas Component ──
interface CollaborativeCanvasProps {
  roomId: string;
}

/**
 * Strips the stale '-src' suffix from sourceHandle / targetHandle values.
 * This suffix was briefly introduced and then reverted; any edges persisted
 * during that window (in Vercel Blob or in the Liveblocks room) need to be
 * normalised before React Flow can match them to the correct handles.
 */
function normalizeEdgeHandles(edges: Edge[]): Edge[] {
  return edges.map((edge) => ({
    ...edge,
    sourceHandle: edge.sourceHandle?.replace(/-src$/, '') ?? edge.sourceHandle,
    targetHandle: edge.targetHandle?.replace(/-src$/, '') ?? edge.targetHandle,
  }));
}

function CollaborativeCanvas({ roomId }: CollaborativeCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const { screenToFlowPosition, setNodes, setEdges } = reactFlowInstance;
  const { lastSavedJsonRef } = useCanvasAutosave(roomId);
  const currentNodes = useNodes();
  const currentEdges = useEdges();

  const [canvasMode, setCanvasMode] = useState<'pointer' | 'hand'>('pointer');

  const { undo, redo, canUndo, canRedo } = useHistory();
  const [, updateMyPresence] = useMyPresence();

  // Convert screen coordinates to flow-space coordinates and broadcast via presence
  const onMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const screenPosition = {
        x: event.clientX,
        y: event.clientY,
      };
      const flowPosition = screenToFlowPosition(screenPosition);
      updateMyPresence({ cursor: flowPosition });
    },
    [screenToFlowPosition, updateMyPresence]
  );

  const onMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  const editorActions = useEditorActions();
  const isSidebarOpen = editorActions?.isSidebarOpen ?? false;

  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  // Listen to navbar trigger to open the starter templates modal
  useEffect(() => {
    const handleOpenTemplates = () => {
      setIsTemplatesModalOpen(true);
    };

    window.addEventListener('open-starter-templates', handleOpenTemplates);
    return () => {
      window.removeEventListener('open-starter-templates', handleOpenTemplates);
    };
  }, []);

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      // Replace existing elements collaboratively
      setNodes(template.nodes);
      setEdges(template.edges);

      // Close the modal
      setIsTemplatesModalOpen(false);

      // Fit the view on the next rendering tick once elements are measured
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
      }, 50);
    },
    [setNodes, setEdges, reactFlowInstance]
  );

  // Wire the keyboard shortcuts
  useKeyboardShortcuts({ reactFlowInstance, undo, redo });

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect: liveblocksOnConnect,
    onDelete,
  } = useLiveblocksFlow({
    suspense: true,
    nodes: {
      initial: [],
    },
    edges: {
      initial: [],
    },
  });

  // Guard onConnect: during a reconnect drag React Flow fires onConnect on
  // handle drop IN ADDITION TO onReconnect, producing a duplicate edge.
  // `isReconnecting` is true only for the duration of a reconnect drag.
  // Any onConnect that arrives while `isReconnecting` is a reconnect
  // side-effect — suppress it. All other onConnect calls are real new
  // connections and must always be forwarded.
  const isReconnecting = useRef(false);
  // Tracks whether onReconnect() ran (i.e. drop landed on a valid handle)
  const reconnectCompleted = useRef(false);

  const onConnect = useCallback(
    (connection: Parameters<typeof liveblocksOnConnect>[0]) => {
      if (isReconnecting.current) return; // suppress duplicate during reconnect
      liveblocksOnConnect(connection);
    },
    [liveblocksOnConnect]
  );

  // Handle global keyboard shortcuts (Delete/Backspace to delete elements, V/H to toggle tools)
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = currentNodes.filter((node) => node.selected);
        const selectedEdges = currentEdges.filter((edge) => edge.selected);

        if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

        event.preventDefault();
        onDelete({ nodes: selectedNodes as any, edges: selectedEdges as any });
        return;
      }

      if (event.key.toLowerCase() === 'v') {
        setCanvasMode('pointer');
        return;
      }

      if (event.key.toLowerCase() === 'h') {
        setCanvasMode('hand');
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [currentNodes, currentEdges, onDelete, setCanvasMode]);

  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Load saved canvas state from database on mount if the collaborative room is empty
  useEffect(() => {
    if (hasAttemptedLoad || !roomId) return;

    const loadSavedCanvas = async () => {
      // If the room already has active nodes or edges, skip loading to avoid overwriting collaboration
      if (nodes.length > 0 || edges.length > 0) {
        setHasAttemptedLoad(true);
        return;
      }

      try {
        const res = await fetch(`/api/projects/${roomId}/canvas`);
        if (!res.ok) {
          setHasAttemptedLoad(true);
          return;
        }
        const data = await res.json();
        if (data && (data.nodes?.length > 0 || data.edges?.length > 0)) {
          // Normalise any stale '-src' handle ids before populating the room
          const cleanEdges = normalizeEdgeHandles(data.edges ?? []);

          // Collaboratively populate the canvas
          setNodes(data.nodes);
          setEdges(cleanEdges);

          // Prime the autosave ref with loaded data to prevent immediate redundant autosave
          lastSavedJsonRef.current = JSON.stringify({
            nodes: data.nodes,
            edges: cleanEdges,
          });

          // Fit view after nodes are rendered
          setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
          }, 50);
        }
      } catch (err) {
        console.error('[COLLABORATIVE_CANVAS] Failed to load saved canvas:', err);
      } finally {
        setHasAttemptedLoad(true);
      }
    };

    loadSavedCanvas();
  }, [roomId, nodes, edges, setNodes, setEdges, reactFlowInstance, hasAttemptedLoad, lastSavedJsonRef]);

  // One-shot migration: fix any stale '-src' handle IDs already sitting in the
  // Liveblocks room (written during the brief window those IDs existed).
  const hasMigratedHandles = useRef(false);
  useEffect(() => {
    if (hasMigratedHandles.current || edges.length === 0) return;
    const allEdges = edges as Edge[];
    const stale = allEdges.filter(
      (e) => e.sourceHandle?.endsWith('-src') || e.targetHandle?.endsWith('-src')
    );
    if (stale.length === 0) {
      hasMigratedHandles.current = true;
      return;
    }
    console.info(`[CANVAS] Migrating ${stale.length} stale edge handle(s)`);
    const fixed = normalizeEdgeHandles(stale);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEdgesChange(fixed.map((e) => ({ type: 'replace', id: e.id, item: e } as any)));
    hasMigratedHandles.current = true;
  }, [edges, onEdgesChange]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onReconnectStart = useCallback(() => {
    // Mark that a reconnect drag is in flight so onConnect suppresses its
    // duplicate call for the duration of this drag.
    isReconnecting.current = true;
    reconnectCompleted.current = false;
  }, []);

  // onReconnect fires only when dropped on a valid handle.
  // `replace` calls reconcile() on the existing LiveMap entry in Liveblocks,
  // updating source/target/handles in-place — no new edge ID is created.
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      reconnectCompleted.current = true;
      const updatedEdge = reconnectEdge(oldEdge, newConnection, [oldEdge])[0] as Edge | undefined;
      if (!updatedEdge) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onEdgesChange([{ type: 'replace', id: oldEdge.id, item: updatedEdge } as any]);
    },
    [onEdgesChange]
  );

  // Clear the reconnect flag. If onReconnect never ran (dropped on empty space),
  // delete the dangling edge collaboratively.
  // Signature: (event, edge, handleType, connectionState) per @xyflow/react v12.
  const onReconnectEnd = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_evt: MouseEvent | TouchEvent, edge: Edge, _handleType: unknown, _cs: unknown) => {
      isReconnecting.current = false;
      if (!reconnectCompleted.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (onDelete as any)({ nodes: [], edges: [edge] });
      }
    },
    [onDelete]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData) return;

      try {
        const { shape, width, height } = JSON.parse(rawData);

        const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
        if (!reactFlowBounds) return;

        const screenPosition = {
          x: event.clientX,
          y: event.clientY,
        };

        // Convert the cursor screen position to flow space coordinates
        const flowPosition = screenToFlowPosition(screenPosition);
        
        // Offset the top-left coordinate so the center of the node aligns exactly with the cursor
        const position = {
          x: flowPosition.x - width / 2,
          y: flowPosition.y - height / 2,
        };

        const timestamp = Date.now();
        const currentCounter = ++nodeCounter;
        const nodeId = `${shape}-${timestamp}-${currentCounter}`;

        const newNode = {
          id: nodeId,
          type: 'canvasNode',
          position,
          style: {
            width,
            height,
          },
          data: {
            label: '',
            color: '#1F1F1F', // default neutral fill color
            shape,
          },
        };

        // Add node via React Flow hook - automatically captured by useLiveblocksFlow's onNodesChange
        setNodes((nds) => nds.concat(newNode));
      } catch (error) {
        console.error('Failed to parse drag payload or drop node:', error);
      }
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div
      ref={reactFlowWrapper}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "w-full h-full relative select-none bg-[#09090b]",
        canvasMode === 'hand' && "cursor-grab [&_.react-flow__pane]:cursor-grab [&_.react-flow__node]:!cursor-grab [&_.react-flow__edge]:!cursor-grab [&_.react-flow__pane]:active:cursor-grabbing [&_.react-flow__node]:active:!cursor-grabbing"
      )}
      tabIndex={0}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Custom SVG markers for dynamic arrow highlighting */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          <marker
            id="arrow-inactive"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--border-subtle)" />
          </marker>
          <marker
            id="arrow-active"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--text-primary)" />
          </marker>
        </defs>
      </svg>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        onDelete={onDelete}
        deleteKeyCode={null}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        selectionOnDrag={canvasMode === 'pointer'}
        selectionKeyCode={null}
        selectionMode={SelectionMode.Partial}
        nodesDraggable={canvasMode === 'pointer'}
        nodesConnectable={canvasMode === 'pointer'}
        elementsSelectable={canvasMode === 'pointer'}
        panOnDrag={canvasMode === 'hand'}
        edgesReconnectable={true}
        // Default edge options — arrows are rendered by the custom SVG marker
        // defined in the canvas. Do NOT set markerEnd here; the custom edge
        // renderer references url(#arrow-inactive / #arrow-active) directly.
        defaultEdgeOptions={{
          type: 'canvasEdge',
          style: {
            stroke: 'var(--border-subtle)',
            strokeWidth: 1.5,
          },
        }}
      >
        {/* Subtle grid background using theme tokens */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="var(--border-subtle)"
        />
        
      </ReactFlow>

      {/* Floating Live Cursors Layer */}
      <LiveCursorsLayer />

      {/* Floating Shape Panel */}
      <ShapePanel canvasMode={canvasMode} onChangeCanvasMode={setCanvasMode} />

      {/* Floating Control Bar */}
      <div 
        className={cn(
          "nodrag nopan absolute bottom-6 z-50 flex items-center gap-1.5 p-1 rounded-full border border-border-default bg-bg-surface/95 shadow-2xl backdrop-blur-md transition-all duration-300 ease-in-out",
          isSidebarOpen ? "left-[280px]" : "left-6"
        )}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              reactFlowInstance.zoomOut({ duration: 200 });
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              reactFlowInstance.fitView({ duration: 200 });
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all cursor-pointer"
            title="Fit View"
          >
            <Maximize className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              reactFlowInstance.zoomIn({ duration: 200 });
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all cursor-pointer"
            title="Zoom In (+ or =)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Thin Divider */}
        <div className="w-[1px] h-4 bg-border-default mx-0.5" />

        {/* History Controls */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={!canUndo}
            onClick={(e) => {
              e.stopPropagation();
              undo();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-muted transition-all cursor-pointer"
            title="Undo (Ctrl/Cmd + Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!canRedo}
            onClick={(e) => {
              e.stopPropagation();
              redo();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-muted transition-all cursor-pointer"
            title="Redo (Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Starter Templates Modal */}
      <StarterTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onImport={handleImportTemplate}
      />
    </div>
  );
}

// ── Collaborative Canvas Wrapper ──
interface CollaborativeCanvasWrapperProps {
  roomId: string;
}

export function CollaborativeCanvasWrapper({ roomId }: CollaborativeCanvasWrapperProps) {
  return (
    <CanvasErrorBoundary
      fallback={
        <div className="flex h-full w-full flex-col items-center justify-center bg-bg-base p-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-state-error/10 text-state-error animate-pulse">
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold tracking-tight text-text-primary">
            Workspace Connection Lost
          </h2>
          <p className="max-w-md text-sm text-text-secondary leading-relaxed">
            There was a problem establishing a real-time connection. The room may have expired, or you may have lost internet connectivity.
          </p>
        </div>
      }
    >
      <ClientSideSuspense
        fallback={
          <div className="flex h-full w-full flex-col items-center justify-center bg-bg-base p-6 text-center">
            <div className="relative mb-4 flex h-14 w-14 items-center justify-center">
              {/* Premium spinning outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-accent-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-accent-primary border-t-transparent animate-spin" />
              <span className="text-xs font-bold text-accent-primary">LB</span>
            </div>
            <p className="text-sm font-medium text-text-secondary tracking-wide animate-pulse">
              Establishing secure collaborative workspace connection...
            </p>
          </div>
        }
      >
        <ReactFlowProvider>
          <CollaborativeCanvas roomId={roomId} />
        </ReactFlowProvider>
      </ClientSideSuspense>
    </CanvasErrorBoundary>
  );
}

