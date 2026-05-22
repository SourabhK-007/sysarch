import { useState, useEffect, useRef, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

export type SaveStatus = 'saved' | 'saving' | 'error' | 'idle';

export function useCanvasAutosave(projectId: string | undefined) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved'); // start as saved
  const { getNodes, getEdges } = useReactFlow();
  
  // Track last saved state to avoid redundant saves of the same JSON
  const lastSavedJsonRef = useRef<string>('');

  const saveCanvas = useCallback(async () => {
    if (!projectId) return;
    
    const nodes = getNodes();
    const edges = getEdges();
    
    // Don't save if there are no nodes/edges and we haven't loaded yet
    // to avoid overriding database records with an empty state on mount
    if (nodes.length === 0 && edges.length === 0 && !lastSavedJsonRef.current) {
      return;
    }

    const currentJson = JSON.stringify({ nodes, edges });
    
    // Skip if nothing changed from last saved state
    if (currentJson === lastSavedJsonRef.current) {
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/projects/${projectId}/canvas`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: currentJson,
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      lastSavedJsonRef.current = currentJson;
      setSaveStatus('saved');
      console.log('[AUTOSAVE] Saved successfully');
    } catch (error) {
      console.error('[AUTOSAVE_ERROR]', error);
      setSaveStatus('error');
    }
  }, [projectId, getNodes, getEdges]);

  // Watch for changes in nodes/edges and trigger debounced autosave
  useEffect(() => {
    if (!projectId) return;

    // Use a small timer to poll/check for changes.
    // Since React Flow hooks might trigger updates frequently, we can listen
    // to nodes and edges state changes by checking them every 2 seconds if modified.
    const checkAndSave = () => {
      const nodes = getNodes();
      const edges = getEdges();
      
      // If empty and not loaded yet, skip
      if (nodes.length === 0 && edges.length === 0 && !lastSavedJsonRef.current) {
        return;
      }

      const currentJson = JSON.stringify({ nodes, edges });
      if (currentJson !== lastSavedJsonRef.current) {
        setSaveStatus('saving');
        saveCanvas();
      }
    };

    const intervalId = setInterval(checkAndSave, 3000); // Check every 3 seconds for modified state

    return () => clearInterval(intervalId);
  }, [getNodes, getEdges, saveCanvas, projectId]);

  // Listen to manual save trigger
  useEffect(() => {
    const handleManualSave = () => {
      saveCanvas();
    };

    window.addEventListener('trigger-manual-save', handleManualSave);
    return () => {
      window.removeEventListener('trigger-manual-save', handleManualSave);
    };
  }, [saveCanvas]);

  // Broadcast saveStatus to the rest of the application
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('canvas-save-status', { detail: saveStatus }));
  }, [saveStatus]);

  return { saveStatus, saveCanvas, lastSavedJsonRef };
}
