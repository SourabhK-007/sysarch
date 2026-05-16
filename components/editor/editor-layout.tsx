'use client';

import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { EditorNavbar } from '@/components/editor/editor-navbar';
import { ProjectSidebar } from '@/components/editor/project-sidebar';
import { ProjectDialogs } from '@/components/editor/project-dialogs';
import { useProjectActions } from '@/hooks/use-project-actions';
import { EditorActionsContext } from '@/hooks/use-editor-actions';
import type { ProjectSummary } from '@/hooks/use-project-actions';
import { cn } from '@/lib/utils';

interface EditorLayoutProps {
  children: React.ReactNode;
  ownedProjects: ProjectSummary[];
  sharedProjects: ProjectSummary[];
}

export function EditorLayout({ 
  children, 
  ownedProjects, 
  sharedProjects,
}: EditorLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const actions = useProjectActions();
  const pathname = usePathname();

  // Detect active project from URL: /editor/[roomId]
  const activeProjectId = useMemo(() => {
    const parts = pathname.split('/');
    if (parts[1] === 'editor' && parts[2]) {
      return parts[2];
    }
    return undefined;
  }, [pathname]);

  // Find active project name
  const activeProject = useMemo(() => {
    if (!activeProjectId) return null;
    return (
      ownedProjects.find((p) => p.id === activeProjectId) ||
      sharedProjects.find((p) => p.id === activeProjectId) ||
      null
    );
  }, [activeProjectId, ownedProjects, sharedProjects]);

  const isOwner = useMemo(() => {
    if (!activeProjectId) return false;
    return ownedProjects.some((p) => p.id === activeProjectId);
  }, [activeProjectId, ownedProjects]);

  return (
    <EditorActionsContext.Provider value={{ openCreate: actions.openCreate }}>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-bg-base text-text-primary">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          title={activeProject?.name}
          showWorkspaceActions={!!activeProjectId}
          onShare={activeProjectId ? () => actions.openShare(activeProjectId) : undefined}
          isOwner={isOwner}
          isRightSidebarOpen={isRightSidebarOpen}
          onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
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
            activeProjectId={activeProjectId}
          />

          <main className="flex-1 overflow-hidden relative flex flex-col">
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>

          {/* Right Sidebar Overlay (AI Chat) */}
          <aside
            className={cn(
              "fixed top-14 right-0 z-40 h-[calc(100vh-3.5rem)] w-80 translate-x-full border-l border-border-subtle bg-bg-surface/95 backdrop-blur-md transition-transform duration-300 ease-in-out shadow-2xl",
              isRightSidebarOpen && "translate-x-0"
            )}
          >
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-subtle text-text-muted">
                <span className="text-xl font-bold text-accent-primary">AI</span>
              </div>
              <h3 className="mb-2 font-semibold text-text-primary">AI Assistant</h3>
              <p className="text-xs text-text-muted">
                AI chat and architecture suggestions will appear here.
              </p>
            </div>
          </aside>
        </div>
      </div>
      <ProjectDialogs actions={actions} isOwner={isOwner} />
    </EditorActionsContext.Provider>
  );
}



