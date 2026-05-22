"use client";

import { useState, useEffect } from "react";
import { PanelLeftClose, PanelLeftOpen, Share2, MessageSquareText, LayoutTemplate, Cloud, CloudOff, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { PresenceNavbarGroup } from "./presence-navbar-group";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  title?: string;
  isRightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
  showWorkspaceActions?: boolean;
  onShare?: () => void;
  isOwner?: boolean;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  title,
  isRightSidebarOpen,
  onToggleRightSidebar,
  showWorkspaceActions = false,
  onShare,
  isOwner = false,
}: EditorNavbarProps) {
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | 'idle'>('saved');

  useEffect(() => {
    const handleSaveStatus = (e: Event) => {
      const status = (e as CustomEvent).detail;
      setSaveStatus(status);
    };

    window.addEventListener('canvas-save-status', handleSaveStatus);
    return () => {
      window.removeEventListener('canvas-save-status', handleSaveStatus);
    };
  }, []);

  return (
    <header className={cn('flex', 'h-14', 'items-center', 'justify-between', 'border-b', 'border-border-subtle', 'bg-bg-base', 'px-4')}>
      {/* Left */}
      <div className={cn('flex', 'items-center', 'gap-2')}>
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className={cn('h-8', 'w-8')}>
          {isSidebarOpen ? (
            <PanelLeftClose className={cn('h-5', 'w-5', 'text-text-secondary')} />
          ) : (
            <PanelLeftOpen className={cn('h-5', 'w-5', 'text-text-secondary')} />
          )}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>

      {/* Center - Project Title */}
      <div className={cn('absolute', 'left-1/2', '-translate-x-1/2', 'flex', 'items-center')}>
        {title && (
          <span className={cn('text-sm', 'font-medium', 'text-text-primary', 'truncate', 'max-w-[200px]', 'md:max-w-[400px]')}>
            {title}
          </span>
        )}
      </div>

      {/* Right */}
      <div className={cn('flex', 'items-center', 'gap-2')}>
        {showWorkspaceActions ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className={cn('h-8', 'gap-2', 'text-text-secondary', 'hidden', 'md:flex')}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-starter-templates'));
              }}
            >
              <LayoutTemplate className={cn('h-4', 'w-4')} />
              <span>Templates</span>
            </Button>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                className={cn('h-8', 'gap-2', 'text-text-secondary', 'hidden', 'md:flex')}
                onClick={onShare}
              >
                <Share2 className={cn('h-4', 'w-4')} />
                <span>Share</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-2 text-xs font-medium border border-border-subtle/50 rounded-xl px-3 transition-all hidden md:flex cursor-pointer select-none",
                saveStatus === 'saving' && "text-accent-primary bg-accent-primary-dim border-accent-primary/20",
                saveStatus === 'saved' && "text-state-success bg-state-success/5 border-state-success/10",
                saveStatus === 'error' && "text-state-error bg-state-error/5 border-state-error/30"
              )}
              disabled={saveStatus === 'saving'}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('trigger-manual-save'));
              }}
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className={cn('h-3.5', 'w-3.5', 'animate-spin', 'text-accent-primary')} />
                  <span>Saving...</span>
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <CloudOff className={cn('h-3.5', 'w-3.5', 'text-state-error')} />
                  <span>Save Error</span>
                </>
              ) : (
                <>
                  <Cloud className={cn('h-3.5', 'w-3.5', 'text-state-success')} />
                  <span>Saved</span>
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleRightSidebar}
              className={cn(
                "h-8 w-fit p-2 rounded-xl   space-x-1 items-center pl-1 text-accent-ai",
                isRightSidebarOpen ? "text-accent-primary bg-accent-primary-dim" : "text-text-secondary"
              )}
            >

              <Sparkles className={cn('h-4', 'w-4 ')} />
              <span >AI</span>
            </Button>
            <div className={cn('h-4', 'w-px', 'bg-border-subtle', 'mx-1')} />

            <PresenceNavbarGroup />
          </>
        ) : (
          <UserButton
            appearance={{
              elements: {
                userButtonPopoverCard: "bg-[var(--bg-elevated)] border-[var(--border-subtle)] shadow-lg rounded-xl",
                userButtonPopoverActionButton: "hover:bg-[var(--bg-subtle)] text-[var(--text-primary)]",
                userButtonPopoverActionButtonText: "text-[var(--text-primary)]",
                userButtonPopoverActionButtonIcon: "text-[var(--text-secondary)]",
                userButtonPopoverFooter: "hidden",
              }
            }}
          />
        )}
      </div>
    </header>
  );
}

