"use client";

import { cn } from "@/lib/utils";

// Helper to extract uppercase initials from a full name (up to 2 letters)
function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0][0]?.toUpperCase() || "?";
}

interface Collaborator {
  connectionId: number;
  id: string;
  info?: {
    name: string;
    avatar: string;
    color: string;
  };
}

interface CollaboratorAvatarsProps {
  filteredOthers: readonly Collaborator[];
}

export function CollaboratorAvatars({ filteredOthers }: CollaboratorAvatarsProps) {
  if (filteredOthers.length === 0) {
    return null;
  }

  const maxVisible = 5;
  const visibleOthers = filteredOthers.slice(0, maxVisible);
  const overflowCount = filteredOthers.length - maxVisible;

  return (
    <div className="flex -space-x-2 items-center">
      {visibleOthers.map((other) => {
        const initials = getInitials(other.info?.name);
        return (
          <div
            key={other.connectionId}
            className="relative h-8 w-8 rounded-full ring-2 ring-bg-base flex-shrink-0 select-none overflow-hidden"
            title={other.info?.name || "Collaborator"}
          >
            {other.info?.avatar ? (
              <img
                src={other.info.avatar}
                alt={other.info.name}
                className="h-full w-full object-cover rounded-full"
                onError={(e) => {
                  // Hide image if it fails to load and show the initials fallback
                  e.currentTarget.style.display = "none";
                  const fallbackEl = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                  if (fallbackEl) {
                    fallbackEl.classList.remove("hidden");
                  }
                }}
              />
            ) : null}
            <div
              style={{
                backgroundColor: other.info?.color || "#EDEDED",
                color: "#080809", // dark contrast text on vivid background
              }}
              className={cn(
                "avatar-fallback absolute inset-0 flex items-center justify-center text-xs font-semibold rounded-full select-none",
                other.info?.avatar && "hidden"
              )}
            >
              {initials}
            </div>
          </div>
        );
      })}

      {overflowCount > 0 && (
        <div
          className="h-8 w-8 rounded-full ring-2 ring-bg-base bg-bg-elevated text-text-secondary flex items-center justify-center text-[10px] font-semibold flex-shrink-0 select-none"
          title={`${overflowCount} more collaborator${overflowCount > 1 ? "s" : ""}`}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
}
