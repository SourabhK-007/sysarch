// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      // Example, a conflict-free list
      // animals: LiveList<string>;
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    // `ai-status-feed` is the shared AI activity broadcast channel for this room.
    RoomEvent:
      | { feed: "ai-status-feed"; active: boolean; text?: string }
      | {
          feed: "ai-chat";
          id: string;
          sender: { name: string; avatar?: string; color?: string };
          role: "user" | "assistant";
          content: string;
          timestamp: string;
        }
      | { feed: "none" };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {
      x: number;
      y: number;
    };

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {
      title: string;
      url: string;
    };
  }
}

export {};
