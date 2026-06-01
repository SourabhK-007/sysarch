'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface ProjectSummary {
  id: string;
  name: string;
}

interface RenameTarget {
  id: string;
  name: string;
}

interface DeleteTarget {
  id: string;
  name: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function shortSuffix(): string {
  return Math.random().toString(36).substring(2, 7);
}

export function useProjectActions() {
  const router = useRouter();

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Rename dialog state
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [renameName, setRenameName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Derived: room ID preview for create dialog
  const roomId = createName.trim()
    ? `${slugify(createName)}-${shortSuffix()}`
    : '';

  // --- Create ---
  const openCreate = useCallback(() => {
    setCreateName('');
    setIsCreateOpen(true);
  }, []);

  const closeCreate = useCallback(() => {
    setIsCreateOpen(false);
    setCreateName('');
  }, []);

  const submitCreate = useCallback(async () => {
    const name = createName.trim() || 'Untitled Project';
    setIsCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to create project');
      const json = await res.json() as { data: ProjectSummary };
      closeCreate();
      router.refresh();
      router.push(`/editor/${json.data.id}`);
    } catch (err) {
      console.error('[useProjectActions] create:', err);
    } finally {
      setIsCreating(false);
    }
  }, [createName, closeCreate, router]);

  // --- Rename ---
  const openRename = useCallback((project: ProjectSummary) => {
    setRenameTarget({ id: project.id, name: project.name });
    setRenameName(project.name);
  }, []);

  const closeRename = useCallback(() => {
    setRenameTarget(null);
    setRenameName('');
  }, []);

  const submitRename = useCallback(async () => {
    if (!renameTarget) return;
    const name = renameName.trim();
    if (!name) return;
    setIsRenaming(true);
    try {
      const res = await fetch(`/api/projects/${renameTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to rename project');
      closeRename();
      router.refresh();
    } catch (err) {
      console.error('[useProjectActions] rename:', err);
    } finally {
      setIsRenaming(false);
    }
  }, [renameTarget, renameName, closeRename, router]);

  // --- Delete ---
  const openDelete = useCallback((project: ProjectSummary) => {
    setDeleteTarget({ id: project.id, name: project.name });
  }, []);

  const closeDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const submitDelete = useCallback(async (activeProjectId?: string) => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to delete project: ${res.status} ${text}`);
      }
      closeDelete();
      if (activeProjectId === deleteTarget.id) {
        router.push('/editor');
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error('[useProjectActions] delete:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, closeDelete, router]);

  // Share dialog state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareProjectId, setShareProjectId] = useState<string | null>(null);

  // --- Share ---
  const openShare = useCallback((projectId: string) => {
    setShareProjectId(projectId);
    setIsShareOpen(true);
  }, []);

  const closeShare = useCallback(() => {
    setIsShareOpen(false);
    setShareProjectId(null);
  }, []);

  return {
    // Create
    isCreateOpen,
    createName,
    setCreateName,
    roomId,
    isCreating,
    openCreate,
    closeCreate,
    submitCreate,

    // Rename
    renameTarget,
    renameName,
    setRenameName,
    isRenaming,
    openRename,
    closeRename,
    submitRename,

    // Delete
    deleteTarget,
    isDeleting,
    openDelete,
    closeDelete,
    submitDelete,

    // Share
    isShareOpen,
    shareProjectId,
    openShare,
    closeShare,
  };
}

