import React from "react";
import { History, Share2, FileText } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      {/* Left Panel (Hidden on small screens) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between px-16 py-8 border-r border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-6 h-6 rounded bg-[var(--accent-primary)]" />
            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Loom AI
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-semibold mb-4 text-[var(--text-primary)] leading-tight">
              Design systems at the<br />speed of thought.
            </h1>
            <p className="text-[var(--text-secondary)] mb-8 text-lg leading-relaxed">
              Describe your architecture in plain English. Loom AI maps it to a shared
              canvas your whole team can refine in real time.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--accent-primary)]">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--text-primary)] mb-1">
                    AI Architecture Generation
                  </h3>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                    Describe your system, AI maps it to nodes and edges on a live canvas.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--accent-primary)]">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--text-primary)] mb-1">
                    Real-time Collaboration
                  </h3>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                    Live cursors, presence indicators, and shared node editing across your team.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--accent-primary)]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--text-primary)] mb-1">
                    Instant Spec Generation
                  </h3>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                    Export a complete Markdown technical spec directly from the canvas graph.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[var(--text-faint)] text-sm mt-12">
          &copy; 2026 Loom AI. All rights reserved.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-6 h-6 rounded bg-[var(--accent-primary)]" />
            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Loom AI
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
