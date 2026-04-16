// ============================================
// REALTIME STATUS BANNER — Sprint 15
// Shows realtime connection status in pilot mode.
// Visible only when disconnected or in pilot mode.
// ============================================

import { useDataMode } from '@/data/DataModeProvider';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function RealtimeStatusBanner() {
  const { mode, realtimeConnected, reconnectRealtime } = useDataMode();

  // Only show in pilot mode
  if (mode !== 'pilot') return null;

  if (realtimeConnected) return null;

  return (
    <div className="bg-[#c4a06a]/15 border-b border-[#c4a06a]/20 px-4 py-2 flex items-center justify-center gap-3 text-xs">
      <WifiOff className="w-3.5 h-3.5 text-[#c4a06a]" />
      <span className="text-[#c4a06a] font-medium">
        Realtime disconnected — attempting to reconnect
      </span>
      <button
        onClick={reconnectRealtime}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#c4a06a]/20 text-[#c4a06a] hover:bg-[#c4a06a]/30 transition-colors font-medium"
      >
        <RefreshCw className="w-3 h-3" />
        Reconnect
      </button>
    </div>
  );
}
