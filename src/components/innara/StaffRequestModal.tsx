"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RequestChat } from './RequestChat';
import { StaffNotes } from './StaffNotes';
import { StatusBadge } from './StatusBadge';
import { getCategoryIcon } from './CategoryIcon';
import { StaffAvatar } from './StaffAvatar';
import { SlaIndicator } from './SlaIndicator';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  Circle,
  CreditCard,
  Play,
  Send,
  StickyNote,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_CONFIG, DEFAULT_SLA } from '@/constants/app';
import type { RequestStatus, RequestCategory } from '@/constants/app';
import type { RequestEntity, StatusEvent } from '@/types/domain';

interface StaffRequestModalProps {
  requestId: string | null;
  onClose: () => void;
  /** Full request data */
  request?: RequestEntity | null;
  /** Status events / timeline */
  events?: StatusEvent[];
  /** Loading state */
  loading?: boolean;
  /** Available staff for assignment */
  availableStaff?: string[];
  /** Callbacks */
  onUpdateStatus?: (requestId: string, newStatus: RequestStatus) => void | Promise<void>;
  onAssignStaff?: (requestId: string, staffName: string) => void;
  onAddInternalNote?: (requestId: string, note: string) => void;
  onSendGuestUpdate?: (requestId: string, message: string) => void;
  onMarkCharged?: (requestId: string) => void;
}

export function StaffRequestModal({
  requestId,
  onClose,
  request = null,
  events = [],
  loading = false,
  availableStaff = [],
  onUpdateStatus,
  onAssignStaff,
  onAddInternalNote,
  onSendGuestUpdate,
  onMarkCharged,
}: StaffRequestModalProps) {
  const [assignedStaff, setAssignedStaff] = useState<string>(
    request?.assignedStaffName || availableStaff[0] || ''
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [guestMessage, setGuestMessage] = useState('');

  const updateStatus = async (newStatus: RequestStatus) => {
    if (!request || !onUpdateStatus) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(request.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const getNextAction = () => {
    if (!request) return null;
    switch (request.status) {
      case 'new':
        return { label: 'Accept Request', action: 'pending' as const, icon: UserPlus };
      case 'pending':
        return { label: 'Start Working', action: 'in_progress' as const, icon: Play };
      case 'in_progress':
        return { label: 'Mark Complete', action: 'completed' as const, icon: CheckCircle2 };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <Dialog open={!!requestId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {loading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              (() => {
                const Icon = getCategoryIcon((request?.category || 'other') as RequestCategory);
                return (
                  <>
                    <Icon className="w-6 h-6 text-accent-gold" />
                    <span>{request?.item || 'Request Details'}</span>
                  </>
                );
              })()
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : request ? (
          <div className="space-y-6 py-2">
            {/* Request Info */}
            <div className="glass-card p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Guest</p>
                  <p className="font-semibold">{request.guestName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Room</p>
                  <p className="font-semibold">{request.roomNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                  <StatusBadge status={request.status} size="sm" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Priority</p>
                  <Badge variant="outline" className="capitalize">{request.priority}</Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">SLA</p>
                  <SlaIndicator
                    createdAt={new Date(request.createdAt)}
                    slaMinutes={DEFAULT_SLA[request.category as keyof typeof DEFAULT_SLA] || 30}
                    status={request.status}
                    size="md"
                  />
                </div>
              </div>
              {request.description && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm">{request.description}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {nextAction && (
              <div className="flex gap-2">
                <Button
                  onClick={() => updateStatus(nextAction.action)}
                  disabled={isUpdating}
                  variant="secondary"
                  className={`flex-1 gap-2 border-[1.5px] ${
                    nextAction.action === 'completed' ? 'border-[#7aaa8a] bg-[#7aaa8a]/10'
                    : nextAction.action === 'in_progress' ? 'border-[#c4a06a] bg-[#c4a06a]/10'
                    : 'border-[#7e9ab8] bg-[#7e9ab8]/10'
                  }`}
                >
                  <nextAction.icon className="w-4 h-4" />
                  {nextAction.label}
                </Button>
              </div>
            )}

            {/* Payment */}
            {request.paymentMethod && (
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-semibold text-sm">Payment</h4>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground uppercase tracking-wide">Method</span>
                    <p className="font-medium mt-0.5 capitalize">
                      {request.paymentMethod === 'room' ? 'Charge to Room' :
                       request.paymentMethod === 'card' ? 'Credit Card' : 'Digital Wallet'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase tracking-wide">Status</span>
                    <p className="font-medium mt-0.5 capitalize">{(request.chargeStatus || 'N/A').replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase tracking-wide">Amount</span>
                    <p className="font-medium mt-0.5">${((request.chargeAmountCents || 0) / 100).toFixed(2)}</p>
                  </div>
                </div>
                {(request.chargeStatus === 'pending_room_charge' || request.chargeStatus === 'pending_card') && onMarkCharged && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 gap-1.5 border-[#7aaa8a] text-[#7aaa8a]"
                    onClick={() => onMarkCharged(request.id)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Charged
                  </Button>
                )}
              </div>
            )}

            {/* Assignment */}
            {availableStaff.length > 0 && (
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-semibold text-sm">Assigned To</h4>
                </div>
                <div className="flex items-center gap-3">
                  <StaffAvatar name={assignedStaff || 'Unassigned'} />
                  <Select value={assignedStaff} onValueChange={(val: string | null) => {
                    if (!val) return;
                    setAssignedStaff(val);
                    onAssignStaff?.(request.id, val);
                  }}>
                    <SelectTrigger className="flex-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStaff.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="glass-card p-4">
              <h4 className="font-semibold mb-3 text-sm">Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Circle className="w-3 h-3 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Request Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {events.map((event) => (
                  <div key={event.id} className="flex items-start gap-2">
                    {event.toStatus === 'completed' ? (
                      <CheckCircle2 className="w-3 h-3 mt-1 text-success" />
                    ) : (
                      <Circle className="w-3 h-3 mt-1 text-info" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {STATUS_CONFIG[event.toStatus]?.label || event.toStatus}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.at).toLocaleString()}
                      </p>
                      {event.note && (
                        <p className="text-xs text-muted-foreground mt-0.5">{event.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photos */}
            {request.photoUrls && request.photoUrls.length > 0 && (
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-sm">Attached Photos</h4>
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {request.photoUrls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border border-border shrink-0" />
                  ))}
                </div>
              </div>
            )}

            {/* Internal Notes */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Internal Notes</h4>
                <span className="text-[10px] bg-secondary/50 px-1.5 py-0.5 rounded text-muted-foreground">Staff only</span>
              </div>
              {request.internalNotes && request.internalNotes.length > 0 && (
                <div className="space-y-2 mb-3">
                  {request.internalNotes.map((n, i) => (
                    <p key={i} className="text-xs bg-secondary/30 rounded-lg p-2">{n}</p>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Add an internal note..."
                  className="min-h-[60px] text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 self-end"
                  disabled={!internalNote.trim()}
                  onClick={() => {
                    onAddInternalNote?.(request.id, internalNote.trim());
                    setInternalNote('');
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Guest Update */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Send Guest Update</h4>
                <span className="text-[10px] bg-[#7aaa8a]/10 text-[#7aaa8a] px-1.5 py-0.5 rounded">Visible to guest</span>
              </div>
              {request.guestUpdates && request.guestUpdates.length > 0 && (
                <div className="space-y-2 mb-3">
                  {request.guestUpdates.map((u, i) => (
                    <p key={i} className="text-xs bg-[#7aaa8a]/10 rounded-lg p-2">{u}</p>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  value={guestMessage}
                  onChange={(e) => setGuestMessage(e.target.value)}
                  placeholder="Send a status update to the guest..."
                  className="min-h-[60px] text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 self-end gap-1"
                  disabled={!guestMessage.trim()}
                  onClick={() => {
                    onSendGuestUpdate?.(request.id, guestMessage.trim());
                    setGuestMessage('');
                  }}
                >
                  <Send className="w-3 h-3" />
                  Send
                </Button>
              </div>
            </div>

            {/* Supabase-backed staff notes */}
            <StaffNotes requestId={request.id} />

            {/* Guest Chat */}
            <RequestChat requestId={request.id} isStaff />
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Request not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
