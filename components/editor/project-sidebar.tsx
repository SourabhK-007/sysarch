"use client";

import { X, Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ProjectSummary } from '@/hooks/use-project-actions';
import type { useProjectActions } from '@/hooks/use-project-actions';

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ownedProjects: ProjectSummary[];
  sharedProjects: ProjectSummary[];
  actions: ReturnType<typeof useProjectActions>;
  activeProjectId?: string;
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  actions,
  activeProjectId,
}: ProjectSidebarProps) {
  return (
    <div
      className={cn(
        'fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64 -translate-x-full border-r border-border-subtle bg-bg-surface/95 backdrop-blur-md transition-transform duration-300 ease-in-out shadow-2xl flex flex-col',
        isOpen && 'translate-x-0'
      )}
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">Projects</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4 text-text-muted" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="my-projects" className="w-full">
          <TabsList className="grid w-full grid-cols-2 ">
            <TabsTrigger value="my-projects" className="cursor-pointer">My Projects</TabsTrigger>
            <TabsTrigger value="shared" className="cursor-pointer">Shared</TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects" className="mt-4 flex flex-col gap-1">
            {ownedProjects.length > 0 ? (
              ownedProjects.map((project) => {
                const isActive = activeProjectId === project.id;
                return (
                  <div
                    key={project.id}
                    className="group relative"
                  >
                    <Link
                      href={`/editor/${project.id}`}
                      onClick={() => {
                        if (window.innerWidth < 768) onClose();
                      }}
                      className={cn(
                        "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-accent-primary-dim text-accent-primary font-medium"
                          : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
                      )}
                    >
                      <span className="truncate pr-8">{project.name}</span>
                    </Link>
                    <div className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
                      isActive && "opacity-100" // always show actions for active project? or maybe not.
                    )}>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          actions.openRename(project);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">Rename</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-state-error hover:text-state-error hover:bg-state-error/10 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          actions.openDelete(project);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle py-8 text-center">
                <p className="text-sm text-text-muted">No projects yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="shared" className="mt-4 flex flex-col gap-1">
            {sharedProjects.length > 0 ? (
              sharedProjects.map((project) => {
                const isActive = activeProjectId === project.id;
                return (
                  <Link
                    key={project.id}
                    href={`/editor/${project.id}`}
                    onClick={() => {
                      if (window.innerWidth < 768) onClose();
                    }}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-accent-primary-dim text-accent-primary font-medium"
                        : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
                    )}
                  >
                    <span className="truncate">{project.name}</span>
                  </Link>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle py-8 text-center">
                <p className="text-sm text-text-muted">No shared projects</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="border-t border-border-subtle p-4">
        <Button className="w-full" variant="default" onClick={actions.openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
  );
}

