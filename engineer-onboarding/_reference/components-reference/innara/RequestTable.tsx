import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Play, CheckCircle2, UserPlus, Eye } from "lucide-react";
import { StaffRequestModal } from "./StaffRequestModal";
import { StatusBadge } from "./StatusBadge";
import { StaffAvatar } from "./StaffAvatar";
import { STATUS_CONFIG, type RequestStatus } from "@/lib/constants";

interface Staff {
  id: string;
  name: string;
  initials: string;
}

interface Request {
  id: string;
  guestName: string;
  roomNumber: string;
  item: string;
  status: RequestStatus;
  createdAt: Date;
  eta?: number;
  assignedStaff?: Staff;
}

interface RequestTableProps {
  requests: Request[];
  onRefresh?: () => void;
  onViewRequest?: (id: string) => void;
  onUpdateStatus?: (requestId: string, status: RequestStatus) => Promise<boolean> | boolean;
}

function getTimeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RequestTable({ requests, onRefresh, onViewRequest, onUpdateStatus }: RequestTableProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const handleViewRequest = (id: string) => {
    if (onViewRequest) {
      onViewRequest(id);
    } else {
      setSelectedRequestId(id);
    }
  };

  const updateStatus = async (requestId: string, newStatus: RequestStatus) => {
    try {
      if (onUpdateStatus) {
        const ok = await onUpdateStatus(requestId, newStatus);
        if (!ok) throw new Error('Update failed');
        toast.success(`Request ${newStatus === 'completed' ? 'completed' : 'updated'}!`);
        return;
      }

      // Get current user for staff assignment
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('requests')
        .update({
          status: newStatus,
          ...(newStatus === 'pending' ? { assigned_staff_id: user?.id } : {}),
          ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', requestId);

      if (error) throw error;

      await supabase.from('request_events').insert([{
        request_id: requestId,
        status: newStatus,
        notes: `Status changed to ${STATUS_CONFIG[newStatus].label}`,
        created_by: user?.id,
      }]);

      toast.success(`Request ${newStatus === 'completed' ? 'completed' : 'updated'}!`);
      onRefresh?.();
    } catch (err) {
      console.error('Error updating request:', err);
      toast.error('Could not update request');
    }
  };

  const getNextAction = (status: string): { label: string; action: RequestStatus; icon: typeof Play } | null => {
    switch (status) {
      case 'new':
        return { label: 'Accept', action: 'pending', icon: UserPlus };
      case 'pending':
        return { label: 'Start', action: 'in_progress', icon: Play };
      case 'in_progress':
        return { label: 'Complete', action: 'completed', icon: CheckCircle2 };
      default:
        return null;
    }
  };

  return (
    <>
      {!onViewRequest && (
        <StaffRequestModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onRefresh={onRefresh}
        />
      )}
      <GlassCard tier="premium" hover={false} className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left py-3 px-5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Guest</th>
              <th className="text-left py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-16">Room</th>
              <th className="text-left py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Request</th>
              <th className="text-left py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-28">Status</th>
              <th className="text-left py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Assigned</th>
              <th className="text-right py-3 px-5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request, idx) => {
              const nextAction = getNextAction(request.status);

              return (
                <tr
                  key={request.id}
                  className={`border-b border-border/15 last:border-0 cursor-pointer hover:bg-secondary/20 transition-colors ${idx === 0 && request.status === 'new' ? 'bg-accent-gold/5' : ''}`}
                  onClick={() => handleViewRequest(request.id)}
                >
                  <td className="py-3.5 px-5">
                    <span className="font-medium text-sm">{request.guestName}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center justify-center w-12 h-7 rounded-lg bg-secondary/80 text-xs font-semibold">
                      {request.roomNumber}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{request.item}</p>
                      <p className="text-xs text-muted-foreground">{getTimeAgo(request.createdAt)}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={request.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    {request.assignedStaff ? (
                      <StaffAvatar name={request.assignedStaff.name} showName />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewRequest(request.id);
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {nextAction && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(request.id, nextAction.action);
                          }}
                          className={`gap-1.5 w-[100px] border-[1.5px] ${
                            nextAction.action === 'completed' ? 'border-[#7aaa8a] bg-[#7aaa8a]/10'
                            : nextAction.action === 'in_progress' ? 'border-[#c4a06a] bg-[#c4a06a]/10'
                            : 'border-[#7e9ab8] bg-[#7e9ab8]/10'
                          }`}
                        >
                          <nextAction.icon className="w-3.5 h-3.5" />
                          {nextAction.label}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassCard>
    </>
  );
}
