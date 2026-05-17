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
  getSmoothStepPath,
  EdgeLabelRenderer,
  EdgeProps,
} from '@xyflow/react';
import { LiveblocksProvider, RoomProvider, ClientSideSuspense, useHistory } from '@liveblocks/react';
import { useLiveblocksFlow } from '@liveblocks/react-flow';
import { Square, Diamond, Circle, Hexagon, Database, Pill, ZoomIn, ZoomOut, Maximize, Undo2, Redo2 } from 'lucide-react';
import { CanvasNode, NodeShape, NODE_COLORS } from '@/types/canvas';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useEditorActions } from '@/hooks/use-editor-actions';
import { cn } from '@/lib/utils';
import { StarterTemplatesModal } from './starter-templates-modal';
import { CanvasTemplate } from './starter-templates';

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

      {/* Handles at all four sides - hidden by default, shown on group/node hover */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !border !border-border-default !w-2 !h-2 !-top-1 cursor-crosshair z-20"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !border !border-border-default !w-2 !h-2 !-right-1 cursor-crosshair z-20"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !border !border-border-default !w-2 !h-2 !-bottom-1 cursor-crosshair z-20"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !border !border-border-default !w-2 !h-2 !-left-1 cursor-crosshair z-20"
      />
    </div>
  );
}

// Custom Node Types Registry for React Flow
const nodeTypes = {
  canvasNode: CustomCanvasNodeRenderer,
};

// ── Custom Canvas Edge Renderer ──
export function CustomCanvasEdgeRenderer({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState((data?.label as string) || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state with incoming collaborative data changes
  useEffect(() => {
    setEditedLabel((data?.label as string) || '');
  }, [data?.label]);

  // Focus the input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const updateLabel = (newLabel: string) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === id) {
          return {
            ...edge,
            data: {
              ...edge.data,
              label: newLabel,
            },
          };
        }
        return edge;
      })
    );
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateLabel(editedLabel);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      updateLabel(editedLabel);
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setEditedLabel((data?.label as string) || '');
      setIsEditing(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const isHighlighted = selected || isHovered;

  // Render input with dynamic width based on characters
  const inputWidth = Math.max(60, editedLabel.length * 7.5 + 20);

  return (
    <>
      {/* Invisible thick path for easy hovering and clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={15}
        className="cursor-pointer pointer-events-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* Visible thin path */}
      <path
        d={edgePath}
        fill="none"
        stroke={isHighlighted ? 'var(--text-primary)' : 'var(--border-subtle)'}
        strokeWidth={1.5}
        markerEnd={markerEnd}
        className="transition-colors duration-200 pointer-events-none"
        style={style}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan z-30 flex items-center justify-center"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editedLabel}
              onChange={(e) => setEditedLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="px-2 py-0.5 text-[11px] font-medium text-center text-text-primary bg-bg-elevated border border-accent-primary rounded-md outline-none shadow-lg"
              style={{ width: `${inputWidth}px` }}
            />
          ) : data?.label ? (
            <div
              onDoubleClick={handleDoubleClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="px-2.5 py-0.5 rounded-full border border-border-subtle bg-bg-surface/90 text-[11px] font-medium text-text-secondary shadow-md backdrop-blur-sm select-none cursor-text hover:text-text-primary hover:border-border-default transition-all duration-200"
            >
              {data.label as string}
            </div>
          ) : isHighlighted ? (
            <div
              onDoubleClick={handleDoubleClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="px-2.5 py-0.5 rounded-full border border-dashed border-border-subtle/50 bg-bg-surface/50 text-[10px] italic font-normal text-text-muted/60 shadow-sm backdrop-blur-sm select-none cursor-pointer hover:text-text-muted hover:border-border-subtle transition-all duration-200"
            >
              Double-click to label
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// Custom Edge Types Registry for React Flow
const edgeTypes = {
  canvasEdge: CustomCanvasEdgeRenderer,
};

// ── Draggable Shape Panel ──
interface ShapeItem {
  shape: string;
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

function ShapePanel() {
  const onDragStart = (event: React.DragEvent, shape: string, width: number, height: number) => {
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
              shape={item.shape as any}
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
      </div>
    </>
  );
}

// ── Inner Collaborative Canvas Component ──
function CollaborativeCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const { screenToFlowPosition, setNodes, setEdges } = reactFlowInstance;

  const { undo, redo, canUndo, canRedo } = useHistory();
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

  // Sync nodes, edges, and change handlers with Liveblocks Room State
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
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

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

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

        const position = screenToFlowPosition(screenPosition);

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
      className="relative h-full w-full bg-bg-base"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        // Default edge options tuned for premium aesthetic (ui-context.md)
        defaultEdgeOptions={{
          type: 'canvasEdge',
          style: {
            stroke: 'var(--border-subtle)',
            strokeWidth: 1.5,
          },
          markerEnd: {
            type: 'arrow',
            color: 'var(--border-subtle)',
            width: 20,
            height: 20,
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

      {/* Floating Shape Panel */}
      <ShapePanel />

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
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={roomId}
          initialPresence={{
            cursor: null,
            isThinking: false,
          }}
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
              <CollaborativeCanvas />
            </ReactFlowProvider>
          </ClientSideSuspense>
        </RoomProvider>
      </LiveblocksProvider>
    </CanvasErrorBoundary>
  );
}

