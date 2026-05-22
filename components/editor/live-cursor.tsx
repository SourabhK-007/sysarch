"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface LiveCursorProps {
  x: number;
  y: number;
  color: string;
  name: string;
  /** When true, shows a small spinner in the cursor name badge. */
  thinking?: boolean;
}

export function LiveCursor({ x, y, color, name, thinking }: LiveCursorProps) {
  // Split name to display only first name/nickname or keep it compact
  const displayName = name.split(/\s+/)[0] || "Anonymous";

  return (
    <div
      className="absolute pointer-events-none z-50 flex items-start transition-all duration-75 ease-out select-none"
      style={{
        left: x,
        top: y,
        transform: "translate(-2px, -2px)", // Align SVG cursor tip precisely
      }}
    >
      {/* Premium cursor pointer SVG */}
      <svg
        className="h-5 w-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
          fill={color}
          stroke="#080809"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* Name Badge — with optional thinking spinner */}
      <div
        style={{ backgroundColor: color }}
        className="ml-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-bg-base whitespace-nowrap shadow-lg select-none"
      >
        {thinking && (
          <Loader2 className="h-2.5 w-2.5 animate-spin flex-shrink-0" />
        )}
        {displayName}
      </div>
    </div>
  );
}
