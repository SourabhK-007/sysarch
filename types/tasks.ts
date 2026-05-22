// Payload schema for the `ai-status-feed` Liveblocks room event feed.
// All incoming messages must be validated against this shape before display.
export interface AiStatusFeedPayload {
  /** True while an AI generation is actively running in this room. */
  active: boolean;
  /** Optional human-readable status message (e.g. "Generating design..."). */
  text?: string;
}

/**
 * Runtime validator for AiStatusFeedPayload.
 * Returns the validated payload, or null if the message does not conform.
 */
export function validateAiStatusFeedPayload(
  raw: unknown
): AiStatusFeedPayload | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.active !== "boolean") return null;
  if (obj.text !== undefined && typeof obj.text !== "string") return null;
  return { active: obj.active, text: obj.text as string | undefined };
}

import { z } from "zod";

// Zod schema for `ai-chat` RoomEvent payload.
// Message shape includes unique ID, sender metadata, role, content, and ISO timestamp.
export const AiChatFeedPayloadSchema = z.object({
  id: z.string(),
  sender: z.object({
    name: z.string(),
    avatar: z.string().optional(),
    color: z.string().optional(),
  }),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.string(), // ISO datetime string
});

export type AiChatFeedPayload = z.infer<typeof AiChatFeedPayloadSchema>;

/**
 * Runtime validator for AiChatFeedPayload.
 * Returns the validated payload, or null if the message does not conform.
 */
export function validateAiChatFeedPayload(
  raw: unknown
): AiChatFeedPayload | null {
  const result = AiChatFeedPayloadSchema.safeParse(raw);
  return result.success ? result.data : null;
}
