"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShareDialog } from '@/components/editor/share-dialog';
import type { useProjectActions } from '@/hooks/use-project-actions';

interface ProjectDialogsProps {
  actions: ReturnType<typeof useProjectActions>;
  isOwner?: boolean;
  activeProjectId?: string;
}

export function ProjectDialogs({ actions, isOwner = false, activeProjectId }: ProjectDialogsProps) {
  const {
    // Create
    isCreateOpen, createName, setCreateName, roomId, isCreating, closeCreate, submitCreate,
    // Rename
    renameTarget, renameName, setRenameName, isRenaming, closeRename, submitRename,
    // Delete
    deleteTarget, isDeleting, closeDelete, submitDelete,
    // Share
    isShareOpen, shareProjectId, closeShare,
  } = actions;

  return (
    <>
      <ShareDialog 
        isOpen={isShareOpen}
        onClose={closeShare}
        projectId={shareProjectId}
        isOwner={isOwner}
      />
      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && closeCreate()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Choose a name for your new architecture project.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Input
                id="create-project-name"
                placeholder="Project Name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitCreate()}
                autoFocus
              />
              {createName.trim() && (
                <p className="text-xs text-text-muted">
                  Room ID: <span className="font-mono text-text-primary">{roomId}</span>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeCreate} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="button" onClick={submitCreate} disabled={isCreating}>
              {isCreating ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && closeRename()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Current name:{' '}
              <span className="font-semibold text-text-primary">{renameTarget?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Input
              id="rename-project-name"
              placeholder="New Project Name"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitRename()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeRename} disabled={isRenaming}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitRename}
              disabled={isRenaming || !renameName.trim() || renameName === renameTarget?.name}
            >
              {isRenaming ? 'Renaming…' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && closeDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-text-primary">{deleteTarget?.name}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={closeDelete} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => submitDelete(activeProjectId)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
