"use client";

import { useOthers } from "@liveblocks/react";
import { useViewport } from "@xyflow/react";
import { LiveCursor } from "./live-cursor";

export function LiveCursorsLayer() {
  const others = useOthers();
  const { x: viewportX, y: viewportY, zoom: viewportZoom } = useViewport();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {others.map((other) => {
        const cursor = other.presence?.cursor;
        if (!cursor) return null;

        // Perform viewport projection: convert canvas/flow coordinates back to screen pixels
        // This keeps cursor size stable regardless of flow scale (zoom level)
        const screenX = cursor.x * viewportZoom + viewportX;
        const screenY = cursor.y * viewportZoom + viewportY;

        return (
          <LiveCursor
            key={other.connectionId}
            x={screenX}
            y={screenY}
            color={other.info?.color || "#52A8FF"}
            name={other.info?.name || "Collaborator"}
            thinking={!!other.presence?.thinking}
          />
        );
      })}
    </div>
  );
}
