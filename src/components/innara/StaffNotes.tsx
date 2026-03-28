"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2, Lock } from 'lucide-react';

interface InternalNote {
  id: string;
  content: string;
  senderName: string;
  createdAt: string;
}

interface StaffNotesProps {
  requestId: string;
  notes?: InternalNote[];
  loading?: boolean;
  onAddNote?: (content: string) => void | Promise<void>;
}

export function StaffNotes({
  notes = [],
  loading = false,
  onAddNote,
}: StaffNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!newNote.trim()) return;

    setIsSending(true);
    try {
      await onAddNote?.(newNote.trim());
      setNewNote('');
    } catch {
      // Error handling delegated to parent
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="glass-card p-4 border-l-4 border-l-warning">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-4 h-4 text-warning" />
        <h4 className="font-semibold text-sm">Internal Notes</h4>
        <span className="text-xs text-muted-foreground">(Staff only)</span>
      </div>

      {/* Notes List */}
      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-xs text-muted-foreground">No internal notes yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="flex gap-2">
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarFallback className="bg-warning/20 text-warning text-[9px]">
                  {getInitials(note.senderName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium">{note.senderName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(note.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{note.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add an internal note..."
          className="flex-1 min-h-[60px] text-sm resize-none"
          disabled={isSending}
        />
        <Button
          onClick={handleSend}
          disabled={!newNote.trim() || isSending}
          size="icon"
          variant="outline"
          className="self-end"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
