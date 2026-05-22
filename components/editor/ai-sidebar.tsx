"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  FileText,
  Download,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useEventListener, useMyPresence, useBroadcastEvent, useSelf } from "@liveblocks/react";
import { validateAiStatusFeedPayload, validateAiChatFeedPayload } from "@/types/tasks";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { designAgentTask } from "@/trigger/design-agent";
import type { specGeneratorTask } from "@/trigger/spec-generator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Helper to extract human-readable filenames from Vercel Blob URL
function getFilename(filePath: string) {
  if (!filePath) return "system-specification.md";
  try {
    const url = new URL(filePath);
    const pathname = url.pathname;
    const filename = pathname.substring(pathname.lastIndexOf("/") + 1);
    // Vercel Blob URL usually has a random suffix: spec-1716382103000-abcde.md.
    // Let's remove the vercel random suffix so it looks like: spec-1716382103000.md
    const vercelSuffixRegex = /-[a-zA-Z0-9]{15,30}\.md$/;
    if (vercelSuffixRegex.test(filename)) {
      return filename.replace(vercelSuffixRegex, ".md");
    }
    return filename;
  } catch {
    const parts = filePath.split("/");
    return parts[parts.length - 1] || "system-specification.md";
  }
}

// Helper to extract uppercase initials from a full name (up to 2 letters)
function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0][0]?.toUpperCase() || "?";
}

// Helper to render Markdown technical specs beautifully inside the UI
function MarkdownPreview({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let currentTable: { headers: string[]; rows: string[][] } | null = null;
  let inList = false;
  let listItems: string[] = [];

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className={cn('list-disc', 'pl-5', 'mb-5', 'space-y-2', 'text-text-secondary', 'select-text')}>
          {listItems.map((item, idx) => (
            <li key={idx} className={cn('text-xs sm:text-[13px]', 'leading-relaxed', 'select-text')}>
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = (key: number) => {
    if (currentTable) {
      elements.push(
        <div key={`table-wrapper-${key}`} className={cn('overflow-x-auto', 'my-6', 'border', 'border-border-subtle/30', 'rounded-xl', 'bg-bg-elevated/40', 'select-text')}>
          <table className={cn('w-full', 'text-xs sm:text-[13px]', 'text-left', 'border-collapse', 'select-text')}>
            <thead>
              <tr className={cn('border-b', 'border-border-subtle/40', 'bg-bg-elevated/80', 'font-bold', 'text-text-primary')}>
                {currentTable.headers.map((h, idx) => (
                  <th key={idx} className={cn('px-4', 'py-3.5', 'font-semibold')}>
                    {parseInlineMarkdown(h.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentTable.rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={cn(
                    "border-b border-border-subtle/35 hover:bg-bg-subtle/30 transition-colors",
                    rowIdx === currentTable!.rows.length - 1 && "border-b-0"
                  )}
                >
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className={cn('px-4', 'py-3', 'text-text-secondary', 'select-text')}>
                      {parseInlineMarkdown(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    }
  };

  const parseInlineMarkdown = (text: string) => {
    let currentText = text;
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    const tokens = currentText.split(regex);

    return tokens.map((token, idx) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        return <strong key={idx} className={cn('font-bold', 'text-text-primary', 'select-text')}>{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith("*") && token.endsWith("*")) {
        return <em key={idx} className={cn('italic', 'text-text-secondary', 'select-text')}>{token.slice(1, -1)}</em>;
      }
      if (token.startsWith("`") && token.endsWith("`")) {
        return (
          <code key={idx} className={cn('px-1.5', 'py-0.5', 'rounded-md', 'bg-bg-subtle', 'text-accent-ai-text', 'font-mono', 'text-[11px] sm:text-xs', 'border', 'border-border-subtle/30', 'select-text')}>
            {token.slice(1, -1)}
          </code>
        );
      }
      return token;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Table checking
    if (line.startsWith("|")) {
      flushList(i);
      const cells = line.split("|").slice(1, -1);
      if (line.includes("---")) {
        continue;
      }
      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else {
      flushTable(i);
    }

    // List checking
    if (line.startsWith("- ") || line.startsWith("* ")) {
      inList = true;
      listItems.push(line.substring(2));
      continue;
    } else if (line.match(/^\d+\.\s/)) {
      inList = true;
      listItems.push(line.replace(/^\d+\.\s/, ""));
      continue;
    } else if (line === "") {
      flushList(i);
      continue;
    } else {
      flushList(i);
    }

    // Headers
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className={cn('text-lg sm:text-xl', 'font-extrabold', 'text-text-primary', 'mt-8', 'mb-4.5', 'border-b', 'border-border-subtle/40', 'pb-2.5 select-text', 'tracking-wide', 'uppercase')}>
          {parseInlineMarkdown(line.substring(2))}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className={cn('text-sm sm:text-base', 'font-bold', 'text-text-primary', 'mt-6', 'mb-3', 'select-text', 'border-l-2', 'border-accent-ai/60', 'pl-3')}>
          {parseInlineMarkdown(line.substring(3))}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className={cn('text-xs sm:text-sm', 'font-semibold', 'text-text-secondary', 'mt-5', 'mb-2', 'select-text')}>
          {parseInlineMarkdown(line.substring(4))}
        </h3>
      );
    } else {
      // General paragraph
      elements.push(
        <p key={i} className={cn('text-xs sm:text-[13px]', 'leading-relaxed', 'text-text-secondary', 'mb-4', 'select-text')}>
          {parseInlineMarkdown(line)}
        </p>
      );
    }
  }

  // Final flush
  flushList(lines.length);
  flushTable(lines.length);

  return <div className={cn('space-y-2', 'select-text', 'pb-4')}>{elements}</div>;
}

interface Message {
  id: string;
  sender: {
    name: string;
    avatar?: string;
    color?: string;
  };
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO datetime string
}

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function AISidebar({ isOpen, onClose, projectId }: AISidebarProps) {
  const [activeTab, setActiveTab] = useState<string>("architect");
  const [prompt, setPrompt] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [, updateMyPresence] = useMyPresence();
  const broadcast = useBroadcastEvent();
  const self = useSelf();

  // ── Shared AI status from the ai-status-feed ────────────────────────────────
  // Tracks the most-recent validated broadcast received from the room.
  const [aiActive, setAiActive] = useState(false);
  const [aiStatusText, setAiStatusText] = useState<string | undefined>();

  // ── Trigger.dev Realtime Task Tracking ────────────────────────────────────
  const [runId, setRunId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Hook to subscribe to task run updates
  const { run } = useRealtimeRun<typeof designAgentTask>(runId || "", {
    accessToken: accessToken || "",
    enabled: !!runId && !!accessToken,
  });

  // Reset tracking states when run finishes (completes, fails, or is canceled)
  useEffect(() => {
    if (run && ["COMPLETED", "FAILED", "CANCELED"].includes(run.status)) {
      setRunId(null);
      setAccessToken(null);
    }
  }, [run?.status]);

  // ── Trigger.dev Realtime Spec Task Tracking ──────────────────────────────
  const [specRunId, setSpecRunId] = useState<string | null>(null);
  const [specAccessToken, setSpecAccessToken] = useState<string | null>(null);

  const { run: specRun } = useRealtimeRun<typeof specGeneratorTask>(specRunId || "", {
    accessToken: specAccessToken || "",
    enabled: !!specRunId && !!specAccessToken,
  });

  // State to hold the specifications list, active spec, content, and loading state
  const [specs, setSpecs] = useState<any[]>([]);
  const [activeSpecContent, setActiveSpecContent] = useState<string>("");
  const [isLoadingSpecs, setIsLoadingSpecs] = useState<boolean>(false);

  // States for Feature 29 Spec UI Integration
  const [selectedSpecForPreview, setSelectedSpecForPreview] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isLoadingPreviewContent, setIsLoadingPreviewContent] = useState<boolean>(false);

  const fetchSpecContent = useCallback(async (specId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/specs/${specId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSpecContent(data.content || "");
      }
    } catch (err) {
      console.error("Failed to fetch spec content", err);
    }
  }, [projectId]);

  const fetchSpecs = useCallback(async () => {
    setIsLoadingSpecs(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/specs`);
      if (res.ok) {
        const data = await res.json();
        setSpecs(data.specs || []);
      }
    } catch (err) {
      console.error("Failed to fetch specs", err);
    } finally {
      setIsLoadingSpecs(false);
    }
  }, [projectId]);

  // Fetch specs on mount or when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchSpecs();
    }
  }, [projectId, fetchSpecs]);

  // Handle Spec generation completed, failed, or canceled
  useEffect(() => {
    if (specRun) {
      if (specRun.status === "COMPLETED") {
        fetchSpecs(); // Refresh list to get the new spec
        setSpecRunId(null);
        setSpecAccessToken(null);
      } else if (["FAILED", "CANCELED"].includes(specRun.status)) {
        setSpecRunId(null);
        setSpecAccessToken(null);
      }
    }
  }, [specRun?.status, fetchSpecs]);

  const isSpecPending = !!specRunId;
  const isPending = !!runId || !!specRunId || aiActive;

  // Subscribe to room-wide broadcasts (both AI status and user chat events)
  useEventListener((event) => {
    if (event.event.feed === "ai-status-feed") {
      const validated = validateAiStatusFeedPayload({
        active: event.event.active,
        text: event.event.text,
      });
      if (!validated) return;
      setAiActive(validated.active);
      setAiStatusText(validated.text);
    } else if (event.event.feed === "ai-chat") {
      const validated = validateAiChatFeedPayload(event.event);
      if (!validated) return;
      setMessages((prev) => {
        // Prevent duplicate local insertions
        if (prev.some((msg) => msg.id === validated.id)) {
          return prev;
        }
        return [...prev, validated];
      });
    }
  });

  // ── Auto-resize the prompt textarea based on content ───────────────────────
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 72), 160);
    textarea.style.height = `${nextHeight}px`;
  }, [prompt]);

  // ── Scroll to bottom of chat when new messages arrive ─────────────────────
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"], [data-radix-scroll-area-viewport]'
    );
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!prompt.trim() || isPending) return;

    const selfInfo = self?.info;
    const senderName = selfInfo?.name || "Anonymous";
    const senderAvatar = selfInfo?.avatar;
    const senderColor = selfInfo?.color || "#00c8d4"; // Cyan brand accent as fallback

    const promptVal = prompt.trim();
    setPrompt("");

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      sender: {
        name: senderName,
        avatar: senderAvatar,
        color: senderColor,
      },
      role: "user",
      content: promptVal,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Broadcast the chat message to all room collaborators
    broadcast({
      feed: "ai-chat",
      ...userMsg,
    });

    try {
      // 1. Submit design prompt to api
      const designRes = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptVal,
          roomId: projectId,
          projectId,
        }),
      });

      if (!designRes.ok) {
        throw new Error("Failed to trigger design agent");
      }

      const { runId: newRunId } = await designRes.json();

      // 2. Fetch scoped public token for that run
      const tokenRes = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: newRunId }),
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to obtain run token");
      }

      const { token } = await tokenRes.json();

      // Update states to begin real-time tracking
      setRunId(newRunId);
      setAccessToken(token);
    } catch (err) {
      console.error("[AI_SIDEBAR_SEND_ERROR]", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-local-error-${Math.random().toString(36).substring(7)}`,
          sender: {
            name: "Loom AI",
            avatar: "",
            color: "#6457f9",
          },
          role: "assistant",
          content: "⚠️ Failed to contact Loom AI. Please verify your network and try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [prompt, isPending, self, broadcast, projectId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleStarterChipClick = useCallback((text: string) => {
    setPrompt(text);
    textareaRef.current?.focus();
  }, []);

  const handleGenerateSpec = useCallback(async () => {
    if (isPending) return;

    try {
      // 1. Submit spec generation trigger to api
      const specRes = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          roomId: projectId,
        }),
      });

      if (!specRes.ok) {
        throw new Error("Failed to trigger spec generator");
      }

      const { runId: newRunId } = await specRes.json();

      // 2. Fetch scoped public token for that run
      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: newRunId }),
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to obtain run token");
      }

      const { token } = await tokenRes.json();

      // Update states to begin real-time tracking
      setSpecRunId(newRunId);
      setSpecAccessToken(token);
    } catch (err) {
      console.error("[AI_SIDEBAR_GENERATE_SPEC_ERROR]", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-local-error-${Math.random().toString(36).substring(7)}`,
          sender: {
            name: "Loom AI",
            avatar: "",
            color: "#6457f9",
          },
          role: "assistant",
          content: "⚠️ Failed to trigger specification generation. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [isPending, projectId]);

  return (
    <>
      <aside
        className={cn(
          "fixed top-14 right-0 z-40 h-[calc(100vh-3.5rem)] w-80 translate-x-full border-l border-border-subtle bg-bg-surface/95 backdrop-blur-md transition-transform duration-300 ease-in-out shadow-2xl flex flex-col overflow-hidden",
          isOpen && "translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn('flex', 'items-center', 'justify-between', 'border-b', 'border-border-subtle', 'px-4', 'py-3', 'bg-bg-base/20')}>
          <div className={cn('flex', 'items-center', 'gap-2')}>
            <div className={cn('flex', 'h-8', 'w-8', 'items-center', 'justify-center', 'rounded-xl', 'bg-accent-ai/10', 'text-accent-ai')}>
              <Bot className={cn('h-4.5', 'w-4.5', 'animate-pulse')} />
            </div>
            <div className={cn('flex', 'flex-col')}>
              <span className={cn('text-xs', 'font-bold', 'tracking-wide', 'text-text-primary')}>
                AI Workspace
              </span>
              <span className={cn('text-[10px]', 'text-text-muted')}>
                Collaborate with Loom AI
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={cn('h-7', 'w-7', 'rounded-lg', 'text-text-secondary', 'hover:text-text-primary', 'hover:bg-bg-subtle')}
          >
            <X className={cn('h-4', 'w-4')} />
            <span className="sr-only">Close AI Sidebar</span>
          </Button>
        </div>

        {/* ── Shared AI Status Banner ─────────────────────────────────────────── */}
        {/* Visible to everyone in the room. Shown whenever ai-status-feed is active. */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            aiActive ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
          )}
          aria-live="polite"
          aria-label="AI generation status"
        >
          <div className={cn('flex', 'items-center', 'gap-2', 'px-4', 'py-2', 'bg-accent-ai/8', 'border-b', 'border-accent-ai/20')}>
            <Loader2 className={cn('h-3.5', 'w-3.5', 'text-accent-ai-text', 'animate-spin', 'flex-shrink-0')} />
            <span className={cn('text-[11px]', 'font-medium', 'text-accent-ai-text', 'truncate')}>
              {aiStatusText ?? "Loom AI is working…"}
            </span>
          </div>
        </div>

        {/* Tabs Layout */}
        <Tabs
          defaultValue="architect"
          value={activeTab}
          onValueChange={setActiveTab}
          className={cn('flex-1', 'flex', 'flex-col', 'overflow-hidden', 'group/tabs', 'min-h-0')}
        >
          <div className={cn('px-4', 'py-2', 'border-b', 'border-border-subtle', 'bg-bg-base/10')}>
            <TabsList className={cn('grid', 'w-full', 'grid-cols-2', 'bg-bg-base', 'border', 'border-border-subtle', 'p-1', 'rounded-xl', 'group-data-horizontal/tabs:h-9')}>
              <TabsTrigger
                value="architect"
                className={cn('text-xs', 'font-semibold', 'py-1.5', 'text-text-muted', 'hover:text-text-primary', 'dark:data-active:text-accent-ai-text', 'dark:data-active:bg-accent-ai/10', 'transition-all', 'rounded-lg', 'cursor-pointer')}
              >
                AI Architect
              </TabsTrigger>
              <TabsTrigger
                value="specs"
                className={cn('text-xs', 'font-semibold', 'py-1.5', 'text-text-muted', 'hover:text-text-primary', 'dark:data-active:text-accent-ai-text', 'dark:data-active:bg-accent-ai/10', 'transition-all', 'rounded-lg', 'cursor-pointer')}
              >
                Specs
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab content panels */}
          <TabsContent
            value="architect"
            className={cn('flex-1', 'flex', 'flex-col', 'overflow-hidden', 'outline-none', 'min-h-0')}
          >
            {/* Scrollable Chat Area */}
            <ScrollArea ref={scrollAreaRef} className={cn('flex-1', 'min-h-0', 'p-4')}>
              {messages.length === 0 ? (
                <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-8', 'text-center', 'px-2')}>
                  <div className={cn('mb-3', 'flex', 'h-10', 'w-10', 'items-center', 'justify-center', 'rounded-2xl', 'bg-accent-ai/10', 'text-accent-ai', 'shadow-md')}>
                    <Sparkles className={cn('h-5', 'w-5')} />
                  </div>
                  <h3 className={cn('mb-1', 'text-xs', 'font-semibold', 'text-text-primary')}>
                    Start Architecture Design
                  </h3>
                  <p className={cn('mb-6', 'text-[10px]', 'leading-relaxed', 'text-text-muted', 'max-w-[220px]')}>
                    Describe your system in plain English. Loom AI will generate
                    nodes, edges, and schemas directly on the canvas.
                  </p>

                  {/* Starter Prompts chips stack */}
                  <div className={cn('w-full', 'flex', 'flex-col', 'gap-2')}>
                    <span className={cn('text-[10px]', 'font-bold', 'text-text-faint', 'uppercase', 'tracking-wider', 'text-left', 'pl-1')}>
                      Starter Ideas
                    </span>
                    {[
                      "Design an e-commerce backend",
                      "Create a chat app architecture",
                      "Build a CI/CD pipeline",
                    ].map((starterText) => (
                      <button
                        key={starterText}
                        onClick={() => handleStarterChipClick(starterText)}
                        disabled={isPending}
                        className={cn('text-left', 'text-[10px]', 'py-2', 'px-3', 'border', 'border-border-subtle', 'bg-bg-subtle/50', 'text-accent-ai-text', 'hover:bg-accent-ai/5', 'hover:border-accent-ai/30', 'transition-all', 'duration-200', 'rounded-xl', 'font-medium', 'cursor-pointer', 'w-full', 'flex', 'items-center', 'justify-between', 'group', 'disabled:opacity-40', 'disabled:cursor-not-allowed', 'disabled:hover:bg-bg-subtle/50', 'disabled:hover:border-border-subtle')}
                      >
                        <span>{starterText}</span>
                        <ArrowRight className={cn('h-3', 'w-3', 'opacity-0', 'group-hover:opacity-100', 'transition-opacity', 'text-accent-ai')} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={cn('space-y-4', 'pb-2')}>
                  {messages.map((msg) => {
                    const isMe = msg.role === "user" && msg.sender?.name === self?.info?.name;
                    const initials = getInitials(msg.sender?.name);
                    const timeString = new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex w-full gap-2 items-start",
                          isMe ? "justify-end" : "justify-start"
                        )}
                      >
                        {/* Avatar/initials for other users */}
                        {!isMe && (
                          <div
                            className={cn('relative', 'h-7', 'w-7', 'rounded-full', 'flex-shrink-0', 'select-none', 'overflow-hidden', 'mt-0.5')}
                            title={msg.sender?.name || "Collaborator"}
                          >
                            {msg.sender?.avatar ? (
                              <img
                                src={msg.sender.avatar}
                                alt={msg.sender.name}
                                className={cn('h-full', 'w-full', 'object-cover', 'rounded-full')}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallbackEl = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                                  if (fallbackEl) {
                                    fallbackEl.classList.remove("hidden");
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              style={{
                                backgroundColor: msg.sender?.color || "#EDEDED",
                                color: "#080809",
                              }}
                              className={cn(
                                "avatar-fallback absolute inset-0 flex items-center justify-center text-[10px] font-bold rounded-full select-none",
                                msg.sender?.avatar && "hidden"
                              )}
                            >
                              {initials}
                            </div>
                          </div>
                        )}

                        {/* Message content and sender info */}
                        <div className={cn("flex flex-col max-w-[70%]", isMe ? "items-end" : "items-start")}>
                          {/* Name and timestamp */}
                          <div className={cn('flex', 'items-center', 'gap-1', 'mb-1', 'px-1')}>
                            <span className={cn('text-[9px]', 'font-semibold', 'text-text-secondary')}>
                              {isMe ? "You" : msg.sender?.name}
                            </span>
                            <span className={cn('text-[9px]', 'text-text-faint')}>•</span>
                            <span className={cn('text-[9px]', 'text-text-faint')}>{timeString}</span>
                          </div>

                          {/* Bubble */}
                          <div
                            className={cn(
                              "rounded-2xl p-2.5 text-[11px] leading-relaxed shadow-sm break-words w-full",
                              isMe
                                ? "bg-accent-primary-dim border border-accent-primary/20 text-text-primary rounded-tr-sm"
                                : msg.role === "assistant"
                                  ? "bg-accent-ai/5 border border-accent-ai/20 text-text-secondary rounded-tl-sm"
                                  : "bg-bg-elevated border border-border-subtle text-text-secondary rounded-tl-sm"
                            )}
                          >
                            {msg.content}
                          </div>
                        </div>

                        {/* Avatar/initials for me */}
                        {isMe && (
                          <div
                            className={cn('relative', 'h-7', 'w-7', 'rounded-full', 'flex-shrink-0', 'select-none', 'overflow-hidden', 'mt-0.5')}
                            title={msg.sender?.name || "You"}
                          >
                            {msg.sender?.avatar ? (
                              <img
                                src={msg.sender.avatar}
                                alt={msg.sender.name}
                                className={cn('h-full', 'w-full', 'object-cover', 'rounded-full')}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallbackEl = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                                  if (fallbackEl) {
                                    fallbackEl.classList.remove("hidden");
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              style={{
                                backgroundColor: msg.sender?.color || "#EDEDED",
                                color: "#080809",
                              }}
                              className={cn(
                                "avatar-fallback absolute inset-0 flex items-center justify-center text-[10px] font-bold rounded-full select-none",
                                msg.sender?.avatar && "hidden"
                              )}
                            >
                              {initials}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Interactive input area */}
            <div className={cn('border-t', 'border-border-subtle', 'p-3', 'bg-bg-base/30')}>
              <div
                className={cn(
                  "relative flex items-end gap-2 border bg-bg-elevated rounded-xl p-2 transition-colors",
                  isPending
                    ? "border-accent-ai/20 opacity-70"
                    : "border-border-subtle focus-within:border-accent-ai/50"
                )}
              >
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isPending}
                  placeholder={
                    isPending
                      ? "Loom AI is working…"
                      : "Ask Loom AI to build architecture..."
                  }
                  className={cn('flex-1', 'bg-transparent', 'border-0', 'outline-none', 'text-[11px]', 'text-text-primary', 'placeholder:text-text-muted/70', 'resize-none', 'min-h-[72px]', 'max-h-[160px]', 'py-1', 'px-1.5', 'leading-relaxed', 'focus:ring-0', 'focus:outline-none', 'disabled:cursor-not-allowed')}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!prompt.trim() || isPending}
                  className={cn(
                    "h-8 w-8 rounded-lg flex-shrink-0 cursor-pointer transition-colors bg-accent-ai hover:bg-accent-ai/90 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                >
                  {isPending ? (
                    <Loader2 className={cn('h-3.5', 'w-3.5', 'animate-spin')} />
                  ) : (
                    <Send className={cn('h-3.5', 'w-3.5')} />
                  )}
                  <span className="sr-only">
                    {isPending ? "AI is working" : "Send message"}
                  </span>
                </Button>
              </div>
              <div className={cn('mt-1.5', 'flex', 'justify-between', 'px-1', 'text-[9px]', 'text-text-faint')}>
                <span>{isPending ? "Generation in progress…" : "Enter to send"}</span>
                <span>Shift + Enter for newline</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="specs"
            className={cn('flex-1', 'flex', 'flex-col', 'overflow-hidden', 'outline-none', 'min-h-0', 'p-4')}
          >
            {/* Action trigger button */}
            <Button
              disabled={isPending}
              className={cn('w-full', 'text-xs', 'font-semibold', 'h-9', 'gap-1.5', 'rounded-xl', 'cursor-pointer', 'bg-accent-ai', 'hover:bg-accent-ai/90', 'text-white', 'shadow-md', 'transition-all', 'mb-4', 'disabled:opacity-50', 'disabled:cursor-not-allowed', 'flex-shrink-0')}
              onClick={handleGenerateSpec}
            >
              {isSpecPending ? (
                <>
                  <Loader2 className={cn('h-3.5', 'w-3.5', 'animate-spin')} />
                  <span>Generating Spec...</span>
                </>
              ) : (
                <>
                  <Sparkles className={cn('h-3.5', 'w-3.5')} />
                  <span>{specs.length > 0 ? "Regenerate Tech Spec" : "Generate Tech Spec"}</span>
                </>
              )}
            </Button>

            {/* Compact Spec List */}
            <div className={cn('flex-1', 'flex', 'flex-col', 'min-h-0')}>
              <div className={cn('flex', 'items-center', 'justify-between', 'mb-2', 'px-1')}>
                <span className={cn('text-[10px]', 'text-text-muted', 'font-bold', 'tracking-wide', 'uppercase')}>
                  Specifications ({specs.length})
                </span>
              </div>

              {isLoadingSpecs && specs.length === 0 ? (
                <div className={cn('flex-1', 'flex', 'flex-col', 'items-center', 'justify-center', 'text-center', 'py-12')}>
                  <Loader2 className={cn('h-6', 'w-6', 'text-accent-ai', 'animate-spin', 'mb-3')} />
                  <span className={cn('text-[10px]', 'text-text-muted', 'font-medium')}>Loading specifications...</span>
                </div>
              ) : specs.length > 0 ? (
                <ScrollArea className={cn('flex-1', 'pr-1')}>
                  <div className={cn('space-y-2', 'pb-4')}>
                    {specs.map((spec) => {
                      const filename = getFilename(spec.filePath);
                      const dateStr = new Date(spec.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={spec.id}
                          onClick={async () => {
                            setSelectedSpecForPreview(spec);
                            setIsPreviewOpen(true);
                            setIsLoadingPreviewContent(true);
                            await fetchSpecContent(spec.id);
                            setIsLoadingPreviewContent(false);
                          }}
                          className={cn('group', 'flex', 'items-center', 'justify-between', 'p-3', 'border', 'border-border-subtle/50', 'bg-bg-elevated/40', 'hover:bg-bg-subtle', 'hover:border-accent-ai/30', 'transition-all', 'rounded-xl', 'cursor-pointer', 'shadow-sm', 'select-none')}
                        >
                          <div className={cn('flex', 'items-center', 'gap-2.5', 'min-w-0')}>
                            <div className={cn('flex', 'h-7', 'w-7', 'items-center', 'justify-center', 'rounded-lg', 'bg-accent-ai/10', 'text-accent-ai', 'group-hover:bg-accent-ai/20', 'transition-colors', 'flex-shrink-0')}>
                              <FileText className={cn('h-4', 'w-4')} />
                            </div>
                            <div className={cn('flex', 'flex-col', 'min-w-0')}>
                              <span className={cn('text-[11px]', 'font-semibold', 'text-text-primary', 'group-hover:text-accent-primary', 'transition-colors', 'truncate')}>
                                {filename}
                              </span>
                              <span className={cn('text-[9px]', 'text-text-muted', 'mt-0.5')}>
                                {dateStr}
                              </span>
                            </div>
                          </div>

                          <a
                            href={`/api/projects/${projectId}/specs/${spec.id}/download`}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className={cn('flex', 'h-7', 'w-7', 'items-center', 'justify-center', 'rounded-lg', 'border', 'border-border-subtle', 'bg-bg-base/30', 'text-text-secondary', 'hover:text-text-primary', 'hover:bg-bg-subtle', 'hover:border-border-subtle', 'transition-all', 'cursor-pointer', 'flex-shrink-0')}
                            title="Download specification"
                          >
                            <Download className={cn('h-3.5', 'w-3.5')} />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className={cn('flex-1', 'flex', 'flex-col', 'items-center', 'justify-center', 'py-8', 'text-center', 'px-4', 'border', 'border-dashed', 'border-border-subtle', 'rounded-2xl', 'bg-bg-surface/30')}>
                  <div className={cn('mb-3', 'flex', 'h-10', 'w-10', 'items-center', 'justify-center', 'rounded-2xl', 'bg-accent-ai/10', 'text-accent-ai', 'shadow-md')}>
                    <FileText className={cn('h-5', 'w-5')} />
                  </div>
                  <h3 className={cn('mb-1', 'text-xs', 'font-semibold', 'text-text-primary')}>
                    No specifications generated
                  </h3>
                  <p className={cn('text-[10px]', 'leading-relaxed', 'text-text-muted', 'max-w-[220px]')}>
                    Loom AI will compile a detailed systems architecture spec based on your canvas. Click the button above to begin.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </aside>

      {/* Preview Modal Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent
          className={cn('w-full', 'h-[85vh]', 'flex', 'flex-col', 'bg-bg-surface/90', 'backdrop-blur-xl', 'border', 'border-border-subtle/50', 'text-text-primary', 'shadow-2xl', 'rounded-3xl', 'p-6', 'outline-none', 'gap-4')}
          style={{ maxWidth: '896px', width: 'calc(100vw - 3rem)' }}
        >
          <DialogHeader className={cn('border-b', 'border-border-subtle/40', 'pb-3.5', 'flex-shrink-0')}>
            <div className={cn('flex', 'items-center', 'gap-3')}>
              <div className={cn('flex', 'h-10', 'w-10', 'items-center', 'justify-center', 'rounded-2xl', 'bg-accent-ai/10', 'text-accent-ai', 'shadow-[0_0_15px_rgba(100,87,249,0.15)]')}>
                <FileText className={cn('h-5', 'w-5')} />
              </div>
              <div className={cn('flex', 'flex-col', 'min-w-0')}>
                <DialogTitle className={cn('text-sm sm:text-base', 'font-extrabold', 'text-text-primary', 'tracking-tight', 'truncate')}>
                  {selectedSpecForPreview ? getFilename(selectedSpecForPreview.filePath) : "Technical Specification"}
                </DialogTitle>
                <span className={cn('text-[10px]', 'text-text-muted', 'mt-0.5')}>
                  {selectedSpecForPreview &&
                    `Generated ${new Date(selectedSpecForPreview.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
                </span>
              </div>
            </div>
          </DialogHeader>

          <div className={cn('flex-1', 'min-h-0', 'bg-bg-base/40', 'backdrop-blur-xs', 'border', 'border-border-subtle/30', 'rounded-2xl', 'p-6', 'sm:p-8', 'shadow-inner')}>
            {isLoadingPreviewContent ? (
              <div className={cn('h-full', 'w-full', 'flex', 'flex-col', 'items-center', 'justify-center', 'gap-3')}>
                <Loader2 className={cn('h-6', 'w-6', 'text-accent-ai', 'animate-spin')} />
                <span className={cn('text-[10px]', 'text-text-muted', 'font-medium')}>Loading specification content...</span>
              </div>
            ) : (
              <ScrollArea className={cn('h-full', 'pr-2', 'text-xs', 'leading-relaxed', 'select-text')}>
                <MarkdownPreview content={activeSpecContent} />
              </ScrollArea>
            )}
          </div>

          <DialogFooter className={cn('flex-shrink-0', 'pt-2', 'border-t', 'border-border-subtle/30', '-mx-6', '-mb-6', 'p-4', 'rounded-b-3xl', 'bg-bg-elevated/40', 'flex', 'items-center', 'justify-between', 'sm:justify-between', 'sm:flex-row', 'gap-3')}>
            <a
              href={selectedSpecForPreview ? `/api/projects/${projectId}/specs/${selectedSpecForPreview.id}/download` : "#"}
              download
              className={cn('flex', 'items-center', 'justify-center', 'text-xs', 'font-semibold', 'h-9', 'px-4.5', 'rounded-xl', 'gap-2', 'border', 'border-accent-ai/30', 'bg-accent-ai/10', 'text-accent-ai-text', 'hover:bg-accent-ai/20', 'hover:text-text-primary', 'transition-all', 'duration-200', 'shadow-md', 'hover:shadow-[0_0_12px_rgba(100,87,249,0.2)]', 'hover:scale-[1.02]', 'active:scale-[0.98]', 'cursor-pointer', 'disabled:opacity-40')}
            >
              <Download className={cn('h-4', 'w-4')} />
              <span>Download Spec (.md)</span>
            </a>

            <Button
              variant="outline"
              onClick={() => setIsPreviewOpen(false)}
              className={cn('text-xs', 'h-9', 'rounded-xl', 'border', 'border-border-default', 'bg-bg-subtle/30', 'hover:bg-bg-subtle', 'text-text-secondary', 'hover:text-text-primary', 'transition-all', 'hover:scale-[1.02]', 'active:scale-[0.98]', 'cursor-pointer', 'px-4.5')}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}



