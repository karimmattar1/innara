"use client";

import { Button } from "@/components/ui/button";
import { InlineBottomSheet } from "./InlineBottomSheet";
import { Trash2, MessageSquare } from "lucide-react";
import type { ConciergeChatSession } from "@/types/domain";

interface ConciergeChatHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: ConciergeChatSession[];
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

export function ConciergeChatHistorySheet({
  open,
  onOpenChange,
  sessions,
  onSelect,
  onDelete,
}: ConciergeChatHistorySheetProps) {
  return (
    <InlineBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Chat History"
      description="Resume a previous conversation"
    >
      <div className="space-y-2">
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No saved chats yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your conversations will appear here when you start a new chat
            </p>
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className="glass-card p-4 flex items-center gap-3"
            >
              <button
                className="flex-1 text-left"
                onClick={() => {
                  onSelect(s.id);
                  onOpenChange(false);
                }}
              >
                <div className="font-medium text-sm text-foreground truncate">
                  {s.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(s.createdAt).toLocaleString()}
                </div>
              </button>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(s.id);
                }}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Delete chat"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </InlineBottomSheet>
  );
}
