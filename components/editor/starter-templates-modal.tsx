'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LayoutTemplate, Plus } from 'lucide-react';
import { CANVAS_TEMPLATES, CanvasTemplate } from './starter-templates';
import { NODE_COLORS } from '@/types/canvas';

// ── Lightweight SVG Diagram Preview Renderer ──
interface TemplatePreviewProps {
  template: CanvasTemplate;
}

function TemplatePreview({ template }: TemplatePreviewProps) {
  const { nodes, edges } = template;

  if (!nodes || nodes.length === 0) return null;

  // Compute the bounding box of the diagram with a custom padding
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const x = node.position.x;
    const y = node.position.y;
    const w = node.style?.width ? Number(node.style.width) : 120;
    const h = node.style?.height ? Number(node.style.height) : 50;

    if (x < minX) minX = x;
    if (x + w > maxX) maxX = x + w;
    if (y < minY) minY = y;
    if (y + h > maxY) maxY = y + h;
  });

  const padding = 40;
  const x = minX - padding;
  const y = minY - padding;
  const width = (maxX - minX) + 2 * padding;
  const height = (maxY - minY) + 2 * padding;

  return (
    <svg
      viewBox={`${x} ${y} ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMidMeet"
      className="w-full h-full select-none pointer-events-none overflow-visible"
    >
      {/* Draw Edges */}
      {edges.map((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (!sourceNode || !targetNode) return null;

        const sw = sourceNode.style?.width ? Number(sourceNode.style.width) : 120;
        const sh = sourceNode.style?.height ? Number(sourceNode.style.height) : 50;
        const tw = targetNode.style?.width ? Number(targetNode.style.width) : 120;
        const th = targetNode.style?.height ? Number(targetNode.style.height) : 50;

        const sx = sourceNode.position.x + sw / 2;
        const sy = sourceNode.position.y + sh / 2;
        const tx = targetNode.position.x + tw / 2;
        const ty = targetNode.position.y + th / 2;

        return (
          <g key={edge.id}>
            <line
              x1={sx}
              y1={sy}
              x2={tx}
              y2={ty}
              stroke="var(--border-subtle)"
              strokeWidth={1.5}
            />
            {typeof edge.data?.label === 'string' && edge.data.label && (
              <g>
                <rect
                  x={(sx + tx) / 2 - 21}
                  y={(sy + ty) / 2 - 8}
                  width={42}
                  height={16}
                  rx={4}
                  fill="var(--bg-elevated)"
                  stroke="var(--border-subtle)"
                  strokeWidth={0.5}
                />
                <text
                  x={(sx + tx) / 2}
                  y={(sy + ty) / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--text-muted)"
                  fontSize="9.5px"
                  fontWeight="bold"
                >
                  {edge.data.label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Draw Nodes */}
      {nodes.map((node) => {
        const shape = node.data.shape || 'rectangle';
        const color = node.data.color || '#1F1F1F';
        const label = node.data.label || '';
        const nx = node.position.x;
        const ny = node.position.y;
        const nw = node.style?.width ? Number(node.style.width) : 120;
        const nh = node.style?.height ? Number(node.style.height) : 50;

        const colorPair = Object.values(NODE_COLORS).find(
          (c) => c.fill.toLowerCase() === color.toLowerCase()
        ) || NODE_COLORS.neutral;
        const textColor = colorPair.text;

        let shapeElement = null;

        if (shape === 'rectangle') {
          shapeElement = (
            <rect
              x={nx}
              y={ny}
              width={nw}
              height={nh}
              rx={8}
              fill={color}
              stroke="var(--border-subtle)"
              strokeWidth={1}
            />
          );
        } else if (shape === 'pill') {
          shapeElement = (
            <rect
              x={nx}
              y={ny}
              width={nw}
              height={nh}
              rx={nh / 2}
              fill={color}
              stroke="var(--border-subtle)"
              strokeWidth={1}
            />
          );
        } else if (shape === 'circle') {
          const radius = Math.min(nw, nh) / 2;
          shapeElement = (
            <circle
              cx={nx + nw / 2}
              cy={ny + nh / 2}
              r={radius}
              fill={color}
              stroke="var(--border-subtle)"
              strokeWidth={1}
            />
          );
        } else if (shape === 'diamond') {
          const points = `${nx + nw / 2},${ny} ${nx + nw},${ny + nh / 2} ${nx + nw / 2},${ny + nh} ${nx},${ny + nh / 2}`;
          shapeElement = (
            <polygon
              points={points}
              fill={color}
              stroke="var(--border-subtle)"
              strokeWidth={1}
            />
          );
        } else if (shape === 'hexagon') {
          const points = `${nx + nw * 0.25},${ny} ${nx + nw * 0.75},${ny} ${nx + nw},${ny + nh / 2} ${nx + nw * 0.75},${ny + nh} ${nx + nw * 0.25},${ny + nh} ${nx},${ny + nh / 2}`;
          shapeElement = (
            <polygon
              points={points}
              fill={color}
              stroke="var(--border-subtle)"
              strokeWidth={1}
            />
          );
        } else if (shape === 'cylinder') {
          shapeElement = (
            <g>
              <path
                d={`M ${nx},${ny + nh * 0.15} A ${nw / 2},${nh * 0.15} 0 0 1 ${nx + nw},${ny + nh * 0.15} V ${ny + nh * 0.85} A ${nw / 2},${nh * 0.15} 0 0 1 ${nx},${ny + nh * 0.85} Z`}
                fill={color}
                stroke="var(--border-subtle)"
                strokeWidth={1}
              />
              <ellipse
                cx={nx + nw / 2}
                cy={ny + nh * 0.15}
                rx={nw / 2}
                ry={nh * 0.15}
                fill={color}
                stroke="var(--border-subtle)"
                strokeWidth={1}
              />
            </g>
          );
        }

        return (
          <g key={node.id}>
            {shapeElement}
            <text
              x={nx + nw / 2}
              y={ny + nh / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill={textColor}
              fontSize="12px"
              fontWeight="600"
              fontFamily="var(--font-geist-sans), sans-serif"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Starter Templates Modal Component ──
interface StarterTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (template: CanvasTemplate) => void;
}

export function StarterTemplatesModal({
  isOpen,
  onClose,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-7xl max-w-lg p-6 bg-bg-surface/95 border-border-default backdrop-blur-md rounded-3xl shadow-2xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <LayoutTemplate className="w-5 h-5 text-accent-primary" />
            <DialogTitle className="text-xl font-bold tracking-tight text-text-primary">
              Starter Architecture Templates
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-text-muted">
            Choose a prebuilt system design to bootstrap your canvas. Importing a template will replace all existing canvas elements.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-1">
            {CANVAS_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="flex flex-col justify-between border border-border-default bg-bg-elevated hover:border-accent-primary/40 focus-within:border-accent-primary/40 transition-all duration-300 rounded-2xl p-4 group"
              >
                <div>
                  <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent-primary transition-colors mb-1">
                    {template.name}
                  </h3>
                  <p className="text-xs leading-relaxed text-text-muted mb-6 h-14 overflow-hidden text-ellipsis line-clamp-3">
                    {template.description}
                  </p>
                </div>

                {/* SVG Visual Preview viewport */}
                <div className="w-full h-48 bg-bg-base/70 border border-border-subtle/80 rounded-xl mb-4 flex items-center justify-center p-3 relative overflow-hidden transition-colors group-hover:bg-bg-base">
                  <TemplatePreview template={template} />
                </div>

                <Button
                  onClick={() => onImport(template)}
                  variant="ghost"
                  className="w-full h-9 rounded-xl text-xs gap-1.5 bg-bg-subtle hover:bg-accent-primary hover:text-bg-base transition-all font-medium border border-border-subtle hover:border-accent-primary"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Import Template</span>
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
