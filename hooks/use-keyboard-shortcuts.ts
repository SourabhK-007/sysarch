import { useEffect } from 'react';
import type { useReactFlow } from '@xyflow/react';

interface UseKeyboardShortcutsProps {
  reactFlowInstance: ReturnType<typeof useReactFlow>;
  undo: () => void;
  redo: () => void;
}

export function useKeyboardShortcuts({
  reactFlowInstance,
  undo,
  redo,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 1. Ignore shortcuts when typing in inputs/textareas/editable fields
      const activeElement = document.activeElement;
      if (activeElement) {
        const tagName = activeElement.tagName.toLowerCase();
        const isEditable = activeElement.getAttribute('contenteditable') === 'true';
        if (tagName === 'input' || tagName === 'textarea' || isEditable) {
          return;
        }
      }

      // 2. Identify Meta key (Cmd on Mac, Ctrl on Windows/Linux)
      const isMac = navigator.userAgent.toLowerCase().includes('mac');
      const isCmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      // 3. Zoom In: '+' or '=' without Cmd/Ctrl
      if (!isCmdOrCtrl && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        reactFlowInstance.zoomIn({ duration: 200 });
      }
      
      // 4. Zoom Out: '-' without Cmd/Ctrl
      else if (!isCmdOrCtrl && event.key === '-') {
        event.preventDefault();
        reactFlowInstance.zoomOut({ duration: 200 });
      }
      
      // 5. Undo: Cmd/Ctrl + Z
      else if (isCmdOrCtrl && !event.shiftKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      }
      
      // 6. Redo: Cmd/Ctrl + Shift + Z
      else if (isCmdOrCtrl && event.shiftKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        redo();
      }
      
      // 7. Redo: Cmd/Ctrl + Y
      else if (isCmdOrCtrl && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reactFlowInstance, undo, redo]);
}
