'use client';

import { createContext, useContext } from 'react';

/**
 * Thin context that exposes only the `openCreate` trigger from EditorLayout
 * downward to page-level client components, without re-exposing all of useProjectActions.
 */
export const EditorActionsContext = createContext<{ 
  openCreate: () => void;
  isSidebarOpen?: boolean;
} | null>(null);

export function useEditorActions() {
  const ctx = useContext(EditorActionsContext);
  if (!ctx) throw new Error('useEditorActions must be used within EditorLayout');
  return ctx;
}
