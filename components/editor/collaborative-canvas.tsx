'use client';

import { Component, ErrorInfo, ReactNode, useRef, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  ConnectionMode,
  useReactFlow,
  ReactFlowProvider,
  NodeProps,
  Handle,
  Position,
} from '@xyflow/react';
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from '@liveblocks/react';
import { useLiveblocksFlow } from '@liveblocks/react-flow';
import { Square, Diamond, Circle, Hexagon, Database, Pill } from 'lucide-react';
import { CanvasNode } from '@/types/canvas';

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

// ── Custom Canvas Node Renderer ──
export function CustomCanvasNodeRenderer({ data }: NodeProps<CanvasNode>) {
  return (
    <div
      style={{
        backgroundColor: data.color || '#1F1F1F',
      }}
      className="group relative h-full w-full rounded-xl border border-border-default flex items-center justify-center p-3 select-none transition-shadow hover:shadow-md"
    >
      <span className="text-text-primary text-sm font-medium text-center truncate px-2">
        {data.label || ' '}
      </span>

      {/* Handles at all four sides - hidden by default, shown on group/node hover */}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !border !border-border-default !w-2 !h-2 !-top-1 cursor-crosshair"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !border !border-border-default !w-2 !h-2 !-right-1 cursor-crosshair"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !border !border-border-default !w-2 !h-2 !-bottom-1 cursor-crosshair"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="opacity-0 group-hover:opacity-100 transition-opacity !bg-white !border !border-border-default !w-2 !h-2 !-left-1 cursor-crosshair"
      />
    </div>
  );
}

// Custom Node Types Registry for React Flow
const nodeTypes = {
  canvasNode: CustomCanvasNodeRenderer,
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
  };

  return (
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
  );
}

// ── Inner Collaborative Canvas Component ──
function CollaborativeCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, setNodes } = useReactFlow();

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
        connectionMode={ConnectionMode.Loose}
        fitView
        // Default edge options tuned for premium aesthetic (ui-context.md)
        defaultEdgeOptions={{
          type: 'smoothstep',
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
        
        {/* Premium styled Minimap */}
        <MiniMap
          className="!bg-bg-surface/90 !border-border-default !rounded-2xl shadow-xl backdrop-blur-sm"
          nodeColor="var(--bg-subtle)"
          maskColor="rgba(8, 8, 9, 0.7)"
          nodeStrokeWidth={1}
          nodeStrokeColor="var(--border-subtle)"
        />
      </ReactFlow>

      {/* Floating Shape Panel */}
      <ShapePanel />
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

