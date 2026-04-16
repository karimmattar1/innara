import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RequestChat } from './RequestChat';
import { StaffNotes } from './StaffNotes';
import { StatusBadge } from './StatusBadge';
import { CategoryIcon, getCategoryIcon } from './CategoryIcon';
import { StaffAvatar } from './StaffAvatar';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  Circle,
  CreditCard,
  Image,
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
import { FALLBACK_STAFF, STATUS_CONFIG, DEFAULT_SLA, type RequestStatus, type RequestCategory } from '@/lib/constants';
import { SlaIndicator } from './SlaIndicator';
import { useInnaraStore } from '@/store/InnaraStoreProvider';
import { useHotel } from '@/contexts/HotelContext';
import type { Database } from '@/integrations/supabase/types';

type RequestRow = Database['public']['Tables']['requests']['Row'];
type RequestEvent = Database['public']['Tables']['request_events']['Row'];

interface StaffRequestModalProps {
  requestId: string | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export function StaffRequestModal({ requestId, onClose, onRefresh }: StaffRequestModalProps) {
  const { dispatch: storeDispatch, getRequestById, getEventsForRequest, state: storeState } = useInnaraStore();
  const { hotel } = useHotel();
  const [request, setRequest] = useState<RequestRow | null>(null);
  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [guestName, setGuestName] = useState('Guest');
  const [assignedStaff, setAssignedStaff] = useState<string>(FALLBACK_STAFF[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [guestMessage, setGuestMessage] = useState('');

  useEffect(() => {
    if (!requestId) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        // Try supabase first
        const { data: reqData, error: reqError } = await supabase
          .from('requests')
          .select('*')
          .eq('id', requestId)
          .single();

        if (reqError) throw reqError;
        setRequest(reqData);

        // Fetch guest name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', reqData.user_id)
          .single();

        if (profile?.full_name) setGuestName(profile.full_name);

        // Fetch events
        const { data: eventsData } = await supabase
          .from('request_events')
          .select('*')
          .eq('request_id', requestId)
          .order('created_at', { ascending: true });

        setEvents(eventsData || []);
      } catch (err) {
        // Fallback to store for demo/store-managed requests
        const storeReq = getRequestById(requestId!);
        if (storeReq) {
          setRequest({
            id: storeReq.id,
            user_id: storeReq.userId,
            hotel_id: storeReq.hotelId,
            room_number: storeReq.roomNumber,
            category: storeReq.category,
            item: storeReq.item,
            description: storeReq.description,
            priority: storeReq.priority,
            status: storeReq.status,
            eta_minutes: storeReq.etaMinutes,
            assigned_staff_id: storeReq.assignedStaffId,
            created_at: storeReq.createdAt,
            updated_at: storeReq.updatedAt,
            completed_at: storeReq.completedAt,
          } as RequestRow);
          setGuestName(storeReq.guestName);
          if (storeReq.assignedStaffName) setAssignedStaff(storeReq.assignedStaffName);

          const storeEvents = getEventsForRequest(requestId!);
          setEvents(storeEvents.map(e => ({
            id: e.id,
            request_id: e.requestId,
            status: e.toStatus,
            notes: e.note,
            created_at: e.at,
            created_by: null,
          } as unknown as RequestEvent)));
        } else {
          console.error('Error fetching request:', err);
          toast.error('Could not load request');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [requestId]);

  const updateStatus = async (newStatus: 'pending' | 'in_progress' | 'completed') => {
    if (!request) return;

    setIsUpdating(true);

    // Dispatch to store for cross-portal propagation
    const hotelId = request.hotel_id || hotel?.id || '';
    storeDispatch({
      type: 'UPDATE_REQUEST_STATUS',
      payload: {
        requestId: request.id,
        newStatus,
        actorName: assignedStaff,
        actorRole: 'staff',
        hotelId,
      },
    });

    try {
      // Get current user for staff assignment
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('requests')
        .update({
          status: newStatus,
          // Set assigned_staff_id when accepting (status = 'pending')
          ...(newStatus === 'pending' ? { assigned_staff_id: user?.id } : {}),
          ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', request.id);

      if (error) throw error;

      // Create event with created_by to track who made the change
      await supabase.from('request_events').insert([{
        request_id: request.id,
        status: newStatus,
        notes: `Status changed to ${STATUS_CONFIG[newStatus].label}`,
        created_by: user?.id,
      }]);
    } catch (err) {
      // Supabase may fail in demo — store dispatch already handled propagation
      console.error('Supabase update failed (store handled):', err);
    }

    setRequest(prev => prev ? { ...prev, status: newStatus } : null);
    toast.success(`Request ${newStatus === 'completed' ? 'completed' : 'updated'}!`);
    onRefresh?.();
    setIsUpdating(false);
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
            {isLoading ? (
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

        {isLoading ? (
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
                  <p className="font-semibold">{guestName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Room</p>
                  <p className="font-semibold">{request.room_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                  <StatusBadge status={request.status as RequestStatus} size="sm" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Priority</p>
                  <Badge variant="outline" className="capitalize">{request.priority}</Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">SLA</p>
                  <SlaIndicator
                    createdAt={new Date(request.created_at)}
                    slaMinutes={DEFAULT_SLA[request.category as keyof typeof DEFAULT_SLA] || 30}
                    status={request.status as RequestStatus}
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

            {/* Payment (Sprint 15) */}
            {(() => {
              const storeReq = getRequestById(request.id);
              const pm = storeReq?.paymentMethod;
              const cs = storeReq?.chargeStatus;
              const amt = storeReq?.chargeAmountCents;
              if (!pm) return null;
              const isPending = cs === 'pending_room_charge' || cs === 'pending_card';
              return (
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Payment</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground uppercase tracking-wide">Method</span>
                      <p className="font-medium mt-0.5 capitalize">{pm === 'room' ? 'Charge to Room' : pm === 'card' ? 'Credit Card' : 'Digital Wallet'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground uppercase tracking-wide">Status</span>
                      <p className="font-medium mt-0.5 capitalize">{(cs || 'N/A').replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground uppercase tracking-wide">Amount</span>
                      <p className="font-medium mt-0.5">${((amt || 0) / 100).toFixed(2)}</p>
                    </div>
                  </div>
                  {isPending && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-1.5 border-[#7aaa8a] text-[#7aaa8a]"
                      onClick={() => {
                        storeDispatch({
                          type: 'UPDATE_REQUEST_PAYMENT',
                          payload: {
                            requestId: request.id,
                            chargeStatus: 'charged',
                            actorName: assignedStaff,
                            hotelId: request.hotel_id || hotel?.id || '',
                          },
                        });
                        toast.success('Charge marked as processed');
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Charged
                    </Button>
                  )}
                </div>
              );
            })()}

            {/* Assignment */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Assigned To</h4>
              </div>
              <div className="flex items-center gap-3">
                <StaffAvatar name={assignedStaff} />
                <Select value={assignedStaff} onValueChange={(val) => {
                  setAssignedStaff(val);
                  if (request) {
                    storeDispatch({
                      type: 'ASSIGN_REQUEST',
                      payload: {
                        requestId: request.id,
                        staffId: `staff-${val.toLowerCase().replace(/\s+/g, '-')}`,
                        staffName: val,
                        actorName: val,
                        hotelId: request.hotel_id || hotel?.id || '',
                      },
                    });
                  }
                  toast.success(`Reassigned to ${val}`);
                }}>
                  <SelectTrigger className="flex-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FALLBACK_STAFF.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Timeline */}
            <div className="glass-card p-4">
              <h4 className="font-semibold mb-3 text-sm">Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Circle className="w-3 h-3 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Request Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {events.map((event) => (
                  <div key={event.id} className="flex items-start gap-2">
                    {event.status === 'completed' ? (
                      <CheckCircle2 className="w-3 h-3 mt-1 text-success" />
                    ) : (
                      <Circle className="w-3 h-3 mt-1 text-info" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {STATUS_CONFIG[event.status as RequestStatus]?.label || event.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                      {event.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5">{event.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photos (from store) */}
            {(() => {
              const storeReq = getRequestById(request.id);
              const photos = storeReq?.photoUrls || [];
              if (photos.length === 0) return null;
              return (
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Image className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Attached Photos</h4>
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    {photos.map((url, i) => (
                      <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border border-border shrink-0" />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Internal Notes — staff only */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Internal Notes</h4>
                <span className="text-[10px] bg-secondary/50 px-1.5 py-0.5 rounded text-muted-foreground">Staff only</span>
              </div>
              {(() => {
                const storeReq = getRequestById(request.id);
                const notes = storeReq?.internalNotes || [];
                return notes.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {notes.map((n, i) => (
                      <p key={i} className="text-xs bg-secondary/30 rounded-lg p-2">{n}</p>
                    ))}
                  </div>
                ) : null;
              })()}
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
                    storeDispatch({
                      type: 'ADD_INTERNAL_NOTE',
                      payload: {
                        requestId: request.id,
                        note: internalNote.trim(),
                        actorName: assignedStaff,
                        hotelId: request.hotel_id || hotel?.id || '',
                      },
                    });
                    setInternalNote('');
                    toast.success('Internal note added');
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Guest Update — visible to guest */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Send Guest Update</h4>
                <span className="text-[10px] bg-[#7aaa8a]/10 text-[#7aaa8a] px-1.5 py-0.5 rounded">Visible to guest</span>
              </div>
              {(() => {
                const storeReq = getRequestById(request.id);
                const updates = storeReq?.guestUpdates || [];
                return updates.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {updates.map((u, i) => (
                      <p key={i} className="text-xs bg-[#7aaa8a]/10 rounded-lg p-2">{u}</p>
                    ))}
                  </div>
                ) : null;
              })()}
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
                    storeDispatch({
                      type: 'ADD_GUEST_UPDATE',
                      payload: {
                        requestId: request.id,
                        message: guestMessage.trim(),
                        actorName: assignedStaff,
                        hotelId: request.hotel_id || hotel?.id || '',
                      },
                    });
                    setGuestMessage('');
                    toast.success('Guest update sent');
                  }}
                >
                  <Send className="w-3 h-3" />
                  Send
                </Button>
              </div>
            </div>

            {/* Internal Notes (legacy Supabase) */}
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
