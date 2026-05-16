'use client';

import { useState } from 'react';
import { EditorNavbar } from '@/components/editor/editor-navbar';
import { ProjectSidebar } from '@/components/editor/project-sidebar';
import { ProjectDialogs } from '@/components/editor/project-dialogs';
import { useProjectActions } from '@/hooks/use-project-actions';
import { EditorActionsContext } from '@/hooks/use-editor-actions';
import type { ProjectSummary } from '@/hooks/use-project-actions';

interface EditorLayoutProps {
  children: React.ReactNode;
  ownedProjects: ProjectSummary[];
  sharedProjects: ProjectSummary[];
}

export function EditorLayout({ children, ownedProjects, sharedProjects }: EditorLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const actions = useProjectActions();

  return (
    <EditorActionsContext.Provider value={{ openCreate: actions.openCreate }}>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-bg-base text-text-primary">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <div className="relative flex flex-1 overflow-hidden">
          {/* Mobile backdrop scrim */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
          <ProjectSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            ownedProjects={ownedProjects}
            sharedProjects={sharedProjects}
            actions={actions}
          />
          <main className="flex-1 overflow-auto relative">
            {children}
          </main>
        </div>
      </div>
      <ProjectDialogs actions={actions} />
    </EditorActionsContext.Provider>
  );
}
