"use client";

import { useEffect, useState } from "react";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProjectDialogs() {
  const {
    activeDialog, dialogPayload, closeDialog,
    addProject, renameProject, deleteProject
  } = useProjectDialogs();

  // Local state for forms
  const [projectName, setProjectName] = useState("");

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (activeDialog === "rename" && dialogPayload?.projectName) {
      setProjectName(dialogPayload.projectName);
    } else {
      setProjectName("");
    }
  }, [activeDialog, dialogPayload]);

  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProject(projectName.trim());
    closeDialog();
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dialogPayload?.projectId) {
      renameProject(dialogPayload.projectId, projectName.trim());
    }
    closeDialog();
  };

  const handleDeleteSubmit = () => {
    if (dialogPayload?.projectId) {
      deleteProject(dialogPayload.projectId);
    }
    closeDialog();
  };

  return (
    <>
      {/* Create Dialog */}
      <Dialog open={activeDialog === "create"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Choose a name for your new architecture project.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="Project Name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  autoFocus
                />
                {projectName && (
                  <p className="text-xs text-text-muted">
                    Preview: <span className="font-mono text-text-primary">{slug}</span>
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={!projectName.trim()}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={activeDialog === "rename"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <form onSubmit={handleRenameSubmit}>
            <DialogHeader>
              <DialogTitle>Rename Project</DialogTitle>
              <DialogDescription>
                Current name: {dialogPayload?.projectName}
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <Input
                placeholder="New Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={!projectName.trim() || projectName === dialogPayload?.projectName}>Rename</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={activeDialog === "delete"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-text-primary">{dialogPayload?.projectName}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDeleteSubmit}>Delete Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
