'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditorActions } from '@/hooks/use-editor-actions';

export function EditorHomeActions() {
  const { openCreate } = useEditorActions();

  return (
    <Button size="lg" onClick={openCreate}>
      <Plus className="mr-2 h-5 w-5" />
      New Project
    </Button>
  );
}
