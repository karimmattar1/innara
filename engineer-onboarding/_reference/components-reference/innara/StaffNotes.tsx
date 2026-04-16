import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface InternalNote {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface StaffNotesProps {
  requestId: string;
}

export function StaffNotes({ requestId }: StaffNotesProps) {
  const { user, profile } = useAuth();
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    async function fetchNotes() {
      try {
        // Fetch internal messages
        const { data, error } = await supabase
          .from('messages')
          .select('id, content, sender_id, created_at')
          .eq('request_id', requestId)
          .eq('is_internal', true)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setNotes(data || []);

        // Fetch profiles for senders
        if (data && data.length > 0) {
          const senderIds = [...new Set(data.map(n => n.sender_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', senderIds);

          const map = new Map<string, string>();
          profilesData?.forEach(p => {
            map.set(p.id, p.full_name || 'Staff');
          });
          setProfiles(map);
        }
      } catch (err) {
        console.error('Error fetching notes:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNotes();

    // Subscribe to new internal notes
    const channel = supabase
      .channel(`staff-notes-${requestId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `request_id=eq.${requestId}`,
      }, async (payload) => {
        const newMsg = payload.new as any;
        if (newMsg.is_internal) {
          setNotes(prev => [...prev, {
            id: newMsg.id,
            content: newMsg.content,
            sender_id: newMsg.sender_id,
            created_at: newMsg.created_at,
          }]);
          
          // Fetch profile for new sender if not cached
          if (!profiles.has(newMsg.sender_id)) {
            const { data } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newMsg.sender_id)
              .single();
            if (data) {
              setProfiles(prev => new Map(prev).set(newMsg.sender_id, data.full_name || 'Staff'));
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  const handleSend = async () => {
    if (!newNote.trim() || !user) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        request_id: requestId,
        sender_id: user.id,
        sender_type: 'staff',
        content: newNote.trim(),
        is_internal: true,
      });

      if (error) throw error;
      setNewNote('');
      toast.success('Note added');
    } catch (err) {
      console.error('Error adding note:', err);
      toast.error('Could not add note');
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
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
          notes.map((note) => {
            const senderName = note.sender_id === user?.id 
              ? profile?.full_name || 'You' 
              : profiles.get(note.sender_id) || 'Staff';
            
            return (
              <div key={note.id} className="flex gap-2">
                <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarFallback className="bg-warning/20 text-warning text-[9px]">
                    {getInitials(senderName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium">{senderName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(note.created_at).toLocaleString([], { 
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
            );
          })
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
