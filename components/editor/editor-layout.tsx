'use client';

import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { EditorNavbar } from '@/components/editor/editor-navbar';
import { ProjectSidebar } from '@/components/editor/project-sidebar';
import { ProjectDialogs } from '@/components/editor/project-dialogs';
import { AISidebar } from './ai-sidebar';
import { useProjectActions } from '@/hooks/use-project-actions';
import { EditorActionsContext } from '@/hooks/use-editor-actions';
import type { ProjectSummary } from '@/hooks/use-project-actions';
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react';
import { cn } from '@/lib/utils';

interface EditorLayoutProps {
  children: React.ReactNode;
  ownedProjects: ProjectSummary[];
  sharedProjects: ProjectSummary[];
}

function RoomContextWrapper({ roomId, children }: { roomId?: string; children: React.ReactNode }) {
  if (!roomId) {
    return <>{children}</>;
  }

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{
          cursor: null,
          thinking: false,
        }}
      >
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
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
    <EditorActionsContext.Provider value={{ openCreate: actions.openCreate, isSidebarOpen }}>
      <RoomContextWrapper roomId={activeProjectId}>
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
            {activeProjectId && (
              <AISidebar
                isOpen={isRightSidebarOpen}
                onClose={() => setIsRightSidebarOpen(false)}
                projectId={activeProjectId}
              />
            )}
          </div>
        </div>
      </RoomContextWrapper>
      <ProjectDialogs actions={actions} isOwner={isOwner} />
    </EditorActionsContext.Provider>
  );
}



