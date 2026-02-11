"use client";

import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/types";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  MessageSquarePlus,
  MoreHorizontal,
  Trash2,
  Pencil,
  MessageSquare,
  Compass,
  Trash,
  X,
} from "lucide-react";
import { useState } from "react";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNew: () => void;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onNew,
  onSwitch,
  onDelete,
  onRename,
  onClearAll,
  isOpen,
  onClose,
}: ConversationSidebarProps) {
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleStartRename = (convo: Conversation) => {
    setRenameId(convo.id);
    setRenameValue(convo.title);
  };

  const handleConfirmRename = () => {
    if (renameId && renameValue.trim()) {
      onRename(renameId, renameValue.trim());
    }
    setRenameId(null);
    setRenameValue("");
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      onDelete(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const groups = groupConversations(conversations, new Date());

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform duration-200 md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Compass className="size-4 text-primary" />
            </div>
            <span className="font-semibold text-sm">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onNew}
              className="text-sidebar-foreground"
            >
              <MessageSquarePlus className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="md:hidden text-sidebar-foreground"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Conversations list */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-4">
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">
                  No conversations yet
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Start a new chat to begin
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.conversations.map((convo) => (
                      <div
                        key={convo.id}
                        className={cn(
                          "group flex items-center gap-1 rounded-lg px-2 py-2 cursor-pointer transition-colors",
                          convo.id === activeConversationId
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "hover:bg-sidebar-accent/50",
                        )}
                        onClick={() => {
                          onSwitch(convo.id);
                          onClose();
                        }}
                      >
                        <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />

                        {renameId === convo.id ? (
                          <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleConfirmRename}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleConfirmRename();
                              if (e.key === "Escape") setRenameId(null);
                            }}
                            className="h-5 text-xs px-1 flex-1 min-w-0"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-xs truncate flex-1 min-w-0">
                            {convo.title}
                          </span>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="opacity-100 md:opacity-70 md:group-hover:opacity-100 shrink-0 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="size-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(convo);
                              }}
                            >
                              <Pencil className="size-3 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTargetId(convo.id);
                              }}
                            >
                              <Trash2 className="size-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {conversations.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive gap-2"
              onClick={() => setShowClearDialog(true)}
            >
              <Trash className="size-3.5" />
              Clear all conversations
            </Button>
          </div>
        )}
      </aside>

      {/* Delete single conversation confirmation dialog */}
      <Dialog
        open={!!deleteTargetId}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete conversation?</DialogTitle>
            <DialogDescription>
              This conversation will be permanently deleted. This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear all confirmation dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Clear all conversations?</DialogTitle>
            <DialogDescription>
              This will permanently delete all your conversations. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                onClearAll();
                setShowClearDialog(false);
              }}
            >
              Delete all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupConversations(
  conversations: Conversation[],
  today: Date,
): { label: string; conversations: Conversation[] }[] {
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 30);

  const buckets: Record<string, Conversation[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    "This Month": [],
    Older: [],
  };

  for (const c of conversations) {
    const date = new Date(c.updatedAt);
    if (date >= todayStart) {
      buckets["Today"].push(c);
    } else if (date >= yesterdayStart) {
      buckets["Yesterday"].push(c);
    } else if (date >= weekStart) {
      buckets["This Week"].push(c);
    } else if (date >= monthStart) {
      buckets["This Month"].push(c);
    } else {
      buckets["Older"].push(c);
    }
  }

  const groups: { label: string; conversations: Conversation[] }[] = [];
  for (const [label, convos] of Object.entries(buckets)) {
    if (convos.length > 0) {
      groups.push({ label, conversations: convos });
    }
  }

  return groups;
}
