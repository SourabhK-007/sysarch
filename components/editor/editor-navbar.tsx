"use client";

import { PanelLeftClose, PanelLeftOpen, Share2, MessageSquareText, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

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
  return (
    <header className="flex h-14 items-center justify-between border-b border-border-subtle bg-bg-base px-4">
      {/* Left */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-8 w-8">
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5 text-text-secondary" />
          ) : (
            <PanelLeftOpen className="h-5 w-5 text-text-secondary" />
          )}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>

      {/* Center - Project Title */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        {title && (
          <span className="text-sm font-medium text-text-primary truncate max-w-[200px] md:max-w-[400px]">
            {title}
          </span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {showWorkspaceActions && (
          <>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 gap-2 text-text-secondary hidden md:flex"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-starter-templates'));
              }}
            >
              <LayoutTemplate className="h-4 w-4" />
              <span>Templates</span>
            </Button>
            {isOwner && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 gap-2 text-text-secondary hidden md:flex"
                onClick={onShare}
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onToggleRightSidebar}
              className={cn(
                "h-8 w-8",
                isRightSidebarOpen ? "text-accent-primary bg-accent-primary-dim" : "text-text-secondary"
              )}
            >
              <MessageSquareText className="h-4 w-4" />
              <span className="sr-only">Toggle AI Sidebar</span>
            </Button>
            <div className="h-4 w-[1px] bg-border-subtle mx-1" />
          </>
        )}
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
      </div>
    </header>
  );
}

