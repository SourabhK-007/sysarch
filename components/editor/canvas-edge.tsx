'use client';

/**
 * CanvasEdge — isolated custom React Flow edge component.
 *
 * Behaviour:
 *   • Unified highlight: when the edge is hovered OR selected, the visible
 *     line stroke AND the arrowhead marker both switch to the active colour.
 *     The selection highlight persists even after the mouse leaves.
 *   • Centre-hover label zone: an invisible hit-area sits at the path midpoint.
 *     Hovering it reveals a faint "Double-click to label" hint when no label
 *     exists, and brightens the label pill when one does.
 *   • Inline editing: double-click anywhere on the edge or the label zone to
 *     enter edit mode. Saves on blur / Enter / Escape.
 *   • Forgiving hover: a transparent 16px-wide ghost path sits on top of the
 *     visible 1.5px line so the user doesn't have to pixel-hunt.
 *   • Arrowhead markers: references the shared SVG <defs> injected by the
 *     canvas wrapper — url(#arrow-active) / url(#arrow-inactive).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  useReactFlow,
} from '@xyflow/react';

export function CanvasEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  selected,
  data,
}: EdgeProps) {
  const { setEdges } = useReactFlow();

  // ── Hover states ────────────────────────────────────────────────────────────
  /** True while the mouse is anywhere over the edge path */
  const [isPathHovered, setIsPathHovered] = useState(false);

  // ── Edit state ──────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState((data?.label as string) ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep local state in sync with collaborative data arriving from Liveblocks
  useEffect(() => {
    setEditedLabel((data?.label as string) ?? '');
  }, [data?.label]);

  // Auto-focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // ── Path geometry ────────────────────────────────────────────────────────────
  // getSmoothStepPath provides right-angle routing + the midpoint coordinates
  // used to position the label without manual calculation (per spec §4).
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  // ── Label collaboration ──────────────────────────────────────────────────────
  const updateLabel = useCallback(
    (newLabel: string) => {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === id
            ? { ...edge, data: { ...edge.data, label: newLabel } }
            : edge
        )
      );
    },
    [id, setEdges]
  );

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    updateLabel(editedLabel);
  }, [editedLabel, updateLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        setIsEditing(false);
        updateLabel(editedLabel);
        e.currentTarget.blur();
      } else if (e.key === 'Escape') {
        // Revert to the last saved value
        setEditedLabel((data?.label as string) ?? '');
        setIsEditing(false);
      }
    },
    [data?.label, editedLabel, updateLabel]
  );

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  // ── Derived visual state ─────────────────────────────────────────────────────
  const isActive = !!(selected || isPathHovered);

  const strokeColor = isActive ? 'var(--text-primary)' : 'var(--border-subtle)';
  const strokeWidth = isActive ? 1.75 : 1.5;
  const markerRef = isActive ? 'url(#arrow-active)' : 'url(#arrow-inactive)';

  const label = (data?.label as string | undefined) ?? '';
  const inputWidth = Math.max(64, editedLabel.length * 7.5 + 24);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/*
        ── Ghost path (interaction layer) ──────────────────────────────────────
        16px-wide transparent path sitting on the visible line. Makes hovering
        and clicking forgiving without visually thickening the edge.
      */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        className="cursor-pointer pointer-events-auto"
        onMouseEnter={() => setIsPathHovered(true)}
        onMouseLeave={() => setIsPathHovered(false)}
        onDoubleClick={handleDoubleClick}
      />

      {/*
        ── Visible edge path ────────────────────────────────────────────────────
        Pointer-events disabled — interaction is handled by the ghost path above.
        Stroke and arrowhead both react to the unified `isActive` state so head
        and tail highlight together (spec §1).
      */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        markerEnd={markerRef}
        className="pointer-events-none transition-all duration-150"
        style={style}
      />

      {/*
        ── Label zone (EdgeLabelRenderer) ──────────────────────────────────────
        Positioned at the path midpoint via labelX/labelY from getSmoothStepPath
        (spec §4 — do not calculate midpoint manually).
        The wrapping div is always rendered so the hover zone is consistently
        present even when there is no label.
      */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan z-30"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            /* ── Active input ─────────────────────────────────────────── */
            <input
              ref={inputRef}
              type="text"
              value={editedLabel}
              onChange={(e) => setEditedLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Label…"
              className="px-2 py-0.5 text-[11px] font-medium text-center text-text-primary bg-bg-elevated border border-accent-primary rounded-md outline-none shadow-lg"
              style={{ width: `${inputWidth}px` }}
            />
          ) : label ? (
            /* ── Saved label pill — brightens when edge is active ──────── */
            <div
              className={[
                'px-2.5 py-0.5 rounded-full border bg-bg-surface/90 text-[11px] font-medium',
                'shadow-md backdrop-blur-sm select-none cursor-text',
                'transition-all duration-200',
                isActive
                  ? 'border-border-default text-text-primary shadow-[0_0_0_2px_rgba(255,255,255,0.06)]'
                  : 'border-border-subtle text-text-secondary',
              ].join(' ')}
            >
              {label}
            </div>
          ) : isActive ? (
            /* ── No label + edge active: show discoverable hint pill ───── */
            <div className="px-2.5 py-0.5 rounded-full border border-dashed border-border-subtle/60 bg-bg-surface/50 text-[10px] italic text-text-muted/50 select-none cursor-text backdrop-blur-sm whitespace-nowrap transition-all duration-150">
              Double-click to label
            </div>
          ) : (
            /* ── At rest: invisible hit zone keeps double-click reachable ─ */
            <div style={{ width: 40, height: 20 }} aria-hidden />
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
