'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Trash2, UserPlus, X, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Collaborator {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  isOwner: boolean;
}

export function ShareDialog({
  isOpen,
  onClose,
  projectId,
  isOwner,
}: ShareDialogProps) {
  const [email, setEmail] = useState('');
  const [owner, setOwner] = useState<Collaborator | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch collaborators when dialog opens
  useEffect(() => {
    if (isOpen && projectId) {
      fetchCollaborators();
    }
  }, [isOpen, projectId]);

  const fetchCollaborators = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      if (res.ok) {
        const json = await res.json();
        setOwner(json.data.owner);
        setCollaborators(json.data.collaborators);
      }
    } catch (err) {
      console.error('Failed to fetch collaborators:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !email.trim()) return;

    setIsInviting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setEmail('');
        fetchCollaborators();
      } else {
        const json = await res.json();
        alert(json.error || 'Failed to invite');
      }
    } catch (err) {
      console.error('Failed to invite:', err);
    } finally {
      setIsInviting(false);
    }
  };

  const onRemove = async (collabEmail: string) => {
    if (!projectId) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators/${encodeURIComponent(collabEmail)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchCollaborators();
      }
    } catch (err) {
      console.error('Failed to remove collaborator:', err);
    }
  };

  const onCopy = () => {
    const url = `${window.location.origin}/editor/${projectId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-text-primary">Share project</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Invite collaborators to this architecture workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 w-full min-w-0">
          {/* Invite Section (Owner Only) */}
          {isOwner && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Invite collaborators
              </h4>
              <form onSubmit={onInvite} className="flex items-center gap-2 w-full">
                <div className="relative flex-1 min-w-0">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11 bg-bg-subtle border-border-subtle text-text-primary placeholder:text-text-faint rounded-xl w-full"
                    disabled={isInviting}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isInviting || !email.trim()}
                  className="h-11 rounded-xl px-4 sm:px-6 shrink-0"
                >
                  {isInviting ? '...' : 'Invite'}
                </Button>
              </form>
            </div>
          )}

          {/* Collaborator List */}
          <div className="space-y-3 min-w-0">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Collaborators
            </h4>
            <div className="rounded-xl border border-border-subtle bg-bg-surface/50 overflow-hidden">
              <ScrollArea className="max-h-64 w-full">
                <div className="flex flex-col p-1.5">
                  {isLoading ? (
                    <div className="p-4 text-center text-sm text-text-muted italic">Loading...</div>
                  ) : (
                    <>
                      {/* Owner */}
                      {owner && (
                        <div className="flex items-center justify-between rounded-lg px-3 py-2.5 min-w-0">
                          <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                            {owner.imageUrl ? (
                              <img
                                src={owner.imageUrl}
                                alt=""
                                className="h-9 w-9 rounded-full border border-border-subtle bg-bg-elevated shrink-0"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-primary-dim text-accent-primary font-medium text-xs shrink-0">
                                {owner.email[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex flex-col overflow-hidden min-w-0">
                              <span className="truncate text-sm font-medium text-text-primary">
                                {owner.name}
                              </span>
                              <span className="truncate text-xs text-text-muted">
                                {owner.email}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-accent-primary bg-accent-primary-dim px-2 py-0.5 rounded-full shrink-0 ml-2">
                            Owner
                          </span>
                        </div>
                      )}

                      {/* Collaborators */}
                      {collaborators.length > 0 ? (
                        collaborators.map((collab) => (
                          <div
                            key={collab.id}
                            className="group flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-bg-subtle transition-colors min-w-0"
                          >
                            <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1 mr-2">
                              {collab.imageUrl ? (
                                <img
                                  src={collab.imageUrl}
                                  alt=""
                                  className="h-9 w-9 rounded-full border border-border-subtle bg-bg-elevated shrink-0"
                                />
                              ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-primary-dim text-accent-primary font-medium text-xs shrink-0">
                                  {collab.email[0].toUpperCase()}
                                </div>
                              )}
                              <div className="flex flex-col overflow-hidden min-w-0">
                                <span className="truncate text-sm font-medium text-text-primary">
                                  {collab.name || collab.email.split('@')[0]}
                                </span>
                                <span className="truncate text-xs text-text-muted">
                                  {collab.email}
                                </span>
                              </div>
                            </div>

                            {isOwner && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="opacity-0 group-hover:opacity-100 text-state-error hover:text-state-error hover:bg-state-error/10 shrink-0 h-8 w-8"
                                onClick={() => onRemove(collab.email)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            )}
                          </div>
                        ))
                      ) : null}

                      {/* Empty State (Only if no collaborators and not loading, owner is always there) */}
                      {!owner && collaborators.length === 0 && (
                        <div className="p-4 text-center text-sm text-text-muted">No collaborators yet</div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Project Link */}
          <div className="space-y-3 min-w-0">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Project link
            </h4>
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 min-w-0 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2.5 flex items-center">
                <span className="text-sm text-text-secondary truncate w-full">
                  {typeof window !== 'undefined' ? `${window.location.origin}/editor/${projectId}` : ''}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-10 w-10 shrink-0 rounded-xl",
                  copied && "text-state-success border-state-success bg-state-success/10"
                )}
                onClick={onCopy}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
}
