import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useInnaraStore } from '@/store/InnaraStoreProvider';
import { useHotel } from '@/contexts/HotelContext';
import { useDataMode } from '@/data/DataModeProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: 'guest' | 'staff' | 'ai';
  created_at: string;
  is_internal: boolean;
}

interface RequestChatProps {
  requestId: string;
  isStaff?: boolean;
}

export function RequestChat({ requestId, isStaff = false }: RequestChatProps) {
  const { user, profile } = useAuth();
  const { hotel } = useHotel();
  const { dispatch: storeDispatch, getMessagesForRequest, state: storeState } = useInnaraStore();
  const { mode } = useDataMode();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('request_id', requestId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages((data || []).map(m => ({
          ...m,
          sender_type: m.sender_type as 'guest' | 'staff' | 'ai'
        })));
      } catch (err) {
        // Fallback to store messages for demo
        const storeMessages = getMessagesForRequest(requestId);
        setMessages(storeMessages.map(m => ({
          id: m.id,
          content: m.body,
          sender_id: m.fromId,
          sender_type: m.fromRole as 'guest' | 'staff' | 'ai',
          created_at: m.at,
          is_internal: m.isInternal,
        })));
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`request-messages-${requestId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `request_id=eq.${requestId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        // Only show non-internal messages to guests
        if (!isStaff && newMsg.is_internal) return;
        setMessages(prev => [...prev, newMsg]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, isStaff]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    const body = newMessage.trim();
    const senderRole = isStaff ? 'staff' : 'guest';
    const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || (isStaff ? 'ST' : 'GU');

    setIsSending(true);

    // Dispatch to store for cross-portal propagation
    storeDispatch({
      type: 'ADD_MESSAGE',
      payload: {
        requestId,
        threadType: 'guest_staff',
        fromRole: senderRole as 'guest' | 'staff',
        fromName: profile?.full_name || (isStaff ? 'Staff' : 'Guest'),
        fromId: user.id,
        fromInitials: initials,
        body,
        isInternal: false,
        hotelId: hotel?.id || '',
      },
    });

    // Optimistic UI update
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      content: body,
      sender_id: user.id,
      sender_type: senderRole as 'guest' | 'staff' | 'ai',
      created_at: new Date().toISOString(),
      is_internal: false,
    }]);
    setNewMessage('');

    try {
      // In pilot mode, use the real Supabase client
      if (mode === 'pilot') {
        const { getPilotSupabase } = await import('@/data/supabaseClient');
        const sb = getPilotSupabase();
        await sb.from('messages').insert({
          hotel_id: hotel?.id || '',
          request_id: requestId,
          sender_id: user.id,
          sender_type: senderRole,
          sender_name: profile?.full_name || (isStaff ? 'Staff' : 'Guest'),
          content: body,
          is_internal: false,
        });
      } else {
        await supabase.from('messages').insert({
          request_id: requestId,
          sender_id: user.id,
          sender_type: senderRole,
          content: body,
          is_internal: false,
        });
      }
    } catch (err) {
      // Supabase may fail in demo — store + optimistic UI already handled
      console.error('Supabase message send failed (store handled):', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Always filter out internal messages from the chat view - internal notes have their own component
  const visibleMessages = messages.filter(m => !m.is_internal);

  const getInitials = (senderId: string, senderType: string) => {
    if (senderId === user?.id) {
      return profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ME';
    }
    return senderType === 'staff' ? 'ST' : senderType === 'ai' ? 'AI' : 'GU';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <h3 className="font-semibold mb-4">Messages</h3>
      
      {/* Messages List */}
      <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
        {visibleMessages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No messages yet. Start a conversation with {isStaff ? 'the guest' : 'staff'}.
          </p>
        ) : (
          visibleMessages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarFallback className={`text-[10px] ${
                    msg.sender_type === 'staff' ? 'bg-info text-info-foreground' : 
                    msg.sender_type === 'ai' ? 'bg-primary text-primary-foreground' :
                    'bg-secondary text-secondary-foreground'
                  }`}>
                    {getInitials(msg.sender_id, msg.sender_type)}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] ${isOwn ? 'text-right' : ''}`}>
                  <div className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                    isOwn 
                      ? 'bg-primary text-primary-foreground rounded-br-md' 
                      : 'bg-secondary text-secondary-foreground rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1"
          disabled={isSending}
        />
        <Button
          onClick={handleSend}
          disabled={!newMessage.trim() || isSending}
          size="icon"
          className=""
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
