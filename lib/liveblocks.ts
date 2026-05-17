import { Liveblocks } from '@liveblocks/node';

const secret = process.env.LIVEBLOCKS_SECRET_KEY;

/**
 * Cached Liveblocks node client
 */
export const liveblocks = new Liveblocks({
  secret: secret || 'sk_dummy_key_for_build',
});

/**
 * Vivid colors from the NODE_COLORS palette for cursors
 */
export const CURSOR_COLORS = [
  '#EDEDED', // Neutral
  '#52A8FF', // Blue
  '#BF7AF0', // Purple
  '#FF990A', // Orange
  '#FF6166', // Red
  '#F75F8F', // Pink
  '#62C073', // Green
  '#0AC7B4', // Teal
];

/**
 * Deterministically map a user ID to a consistent color from the fixed palette.
 */
export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
}
