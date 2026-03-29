"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderType: 'guest' | 'staff' | 'ai';
  createdAt: string;
  isInternal: boolean;
}

interface RequestChatProps {
  requestId: string;
  isStaff?: boolean;
  /** Current user ID for display logic */
  currentUserId?: string;
  /** Current user display name */
  currentUserName?: string;
  /** Initial messages to display */
  messages?: Message[];
  /** Callback when a message is sent */
  onSendMessage?: (body: string, isInternal: boolean) => void | Promise<void>;
  /** Whether messages are loading */
  loading?: boolean;
}

export function RequestChat({
  isStaff = false,
  currentUserId = '',
  currentUserName = '',
  messages: initialMessages = [],
  onSendMessage,
  loading = false,
}: RequestChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync with prop changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const body = newMessage.trim();
    setIsSending(true);

    // Optimistic UI update
    const optimisticMsg: Message = {
      id: `msg-${Date.now()}`,
      content: body,
      senderId: currentUserId,
      senderType: isStaff ? 'staff' : 'guest',
      createdAt: new Date().toISOString(),
      isInternal: false,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');

    try {
      await onSendMessage?.(body, false);
    } catch {
      // Optimistic update already applied
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

  // Filter out internal messages from the chat view
  const visibleMessages = messages.filter(m => !m.isInternal);

  const getInitials = (senderId: string, senderType: string) => {
    if (senderId === currentUserId) {
      return currentUserName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ME';
    }
    return senderType === 'staff' ? 'ST' : senderType === 'ai' ? 'AI' : 'GU';
  };

  if (loading) {
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
            const isOwn = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarFallback className={`text-[10px] ${
                    msg.senderType === 'staff' ? 'bg-info text-info-foreground' :
                    msg.senderType === 'ai' ? 'bg-primary text-primary-foreground' :
                    'bg-secondary text-secondary-foreground'
                  }`}>
                    {getInitials(msg.senderId, msg.senderType)}
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
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
