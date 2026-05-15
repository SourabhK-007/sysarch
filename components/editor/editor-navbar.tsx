"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({ isSidebarOpen, onToggleSidebar }: EditorNavbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border-subtle bg-bg-base px-4">
      {/* Left */}
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5 text-text-secondary" />
          ) : (
            <PanelLeftOpen className="h-5 w-5 text-text-secondary" />
          )}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>

      {/* Center */}
      <div className="flex items-center">
      </div>

      {/* Right */}
      <div className="flex items-center">
        <UserButton 
          appearance={{
            elements: {
              userButtonPopoverCard: "bg-[var(--bg-elevated)] border-[var(--border-subtle)] shadow-lg rounded-xl",
              userButtonPopoverActionButton: "hover:bg-[var(--bg-subtle)] text-[var(--text-primary)]",
              userButtonPopoverActionButtonText: "text-[var(--text-primary)]",
              userButtonPopoverActionButtonIcon: "text-[var(--text-secondary)]",
              userButtonPopoverFooter: "hidden", // hide the footer to keep it simple
            }
          }}
        />
      </div>
    </header>
  );
}
