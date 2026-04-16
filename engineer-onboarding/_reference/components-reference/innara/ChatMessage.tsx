import { Check, Clock, Sparkles } from "lucide-react";

interface RequestInfo {
  id: string;
  item: string;
  category: string;
  eta?: number;
}

interface ChatMessageType {
  id: string;
  sender: 'guest' | 'ai' | 'staff';
  content: string;
  timestamp: Date;
  requestCreated?: RequestInfo;
}

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAI = message.sender === 'ai';
  const isUser = message.sender === 'guest';

  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={isUser ? 'order-2 max-w-[88%]' : 'order-1 max-w-[90%]'}>
        {isAI && (
          <div className="flex items-center gap-2 mb-2 ml-1">
            <div className="w-7 h-7 rounded-full bg-[#1a1d3a] flex items-center justify-center shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-[#9B7340]" />
            </div>
            <span className="text-xs font-semibold text-[#9B7340] uppercase tracking-wide">AI Concierge</span>
          </div>
        )}
        
        <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
          
          {message.requestCreated && (
            <div className="confirmed-card mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#4CAF50]" />
                <span className="text-sm text-white/90">
                  Request submitted: <span className="text-[#9B7340] font-semibold">{message.requestCreated.item}</span>
                </span>
              </div>
              {message.requestCreated.eta && (
                <p className="text-xs text-white/60 mb-3 ml-6">
                  Estimated time: ~{message.requestCreated.eta} minutes
                </p>
              )}
              <div className="confirmed-badge">
                <Check className="w-3.5 h-3.5" />
                <span>Confirmed</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
