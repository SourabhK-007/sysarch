"use client";

import { useOthers } from "@liveblocks/react";
import { CollaboratorAvatars } from "./collaborator-avatars";

export function PresenceNavbarGroup() {
  const others = useOthers();

  return (
    <div className="flex items-center gap-3">
      {/* Collaborator avatars stack */}
      <CollaboratorAvatars filteredOthers={others} />
    </div>
  );
}
