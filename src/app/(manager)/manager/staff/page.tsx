"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  UserPlus,
  MoreHorizontal,
  Search,
  Mail,
  RefreshCw,
  Shield,
  X,
} from "lucide-react";
import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { StaffAvatar } from "@/components/innara/StaffAvatar";
import { EmptyState } from "@/components/innara/EmptyState";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getStaffList,
  getInvitations,
  inviteStaff,
  revokeInvitation,
  resendInvitation,
  deactivateStaff,
  reactivateStaff,
  updateStaffDepartment,
  type StaffMember,
  type StaffInvitation,
} from "@/app/actions/staff-management";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENT_LABELS } from "@/constants/app";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InviteFormData {
  email: string;
  department: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    staff: "Staff",
    front_desk: "Front Desk",
    manager: "Manager",
    super_admin: "Super Admin",
    guest: "Guest",
  };
  return map[role] ?? role;
}

function InvitationStatusBadge({
  status,
}: {
  status: string;
}): React.ReactElement {
  if (status === "accepted") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 border">
        Accepted
      </Badge>
    );
  }
  if (status === "expired") {
    return (
      <Badge className="bg-muted/50 text-muted-foreground border-border/30 border">
        Expired
      </Badge>
    );
  }
  if (status === "revoked") {
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 border">
        Revoked
      </Badge>
    );
  }
  // pending
  return (
    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 border">
      Pending
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Skeleton rows
// ---------------------------------------------------------------------------

function StaffSkeletonRows(): React.ReactElement {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border/20">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-40" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-5 w-24 rounded-full" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-20" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-8" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-8 w-8 rounded-md" />
          </td>
        </tr>
      ))}
    </>
  );
}

function InvitationSkeletonRows(): React.ReactElement {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i} className="border-b border-border/20">
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-44" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-5 w-24 rounded-full" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-20" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-5 w-16 rounded-full" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-8 w-8 rounded-md" />
          </td>
        </tr>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ManagerStaffPage(): React.ReactElement {
  const router = useRouter();

  // Auth
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [userInitials, setUserInitials] = useState<string | undefined>(
    undefined
  );

  // Data
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState("");

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteFormData>({
    email: "",
    department: "",
    role: "staff",
  });
  const [inviteLoading, setInviteLoading] = useState(false);

  // Deactivate confirm
  const [deactivateTarget, setDeactivateTarget] =
    useState<StaffMember | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Revoke confirm
  const [revokeTarget, setRevokeTarget] = useState<StaffInvitation | null>(
    null
  );
  const [revokeLoading, setRevokeLoading] = useState(false);

  // Per-row mutation loading (keyed by id)
  const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set());

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/manager/login");
        return;
      }
      const meta = data.user.user_metadata as
        | Record<string, string>
        | undefined;
      const name = meta?.full_name ?? data.user.email ?? "";
      setUserName(name);
      const parts = name.trim().split(" ");
      setUserInitials(
        parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : name.slice(0, 2).toUpperCase()
      );
    });
  }, [router]);

  // ---------------------------------------------------------------------------
  // Sign out
  // ---------------------------------------------------------------------------

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/manager/login");
  }, [router]);

  // ---------------------------------------------------------------------------
  // Load data
  // ---------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [staffResult, invResult] = await Promise.all([
      getStaffList({ includeInactive: true }),
      getInvitations(),
    ]);
    if (!staffResult.success) {
      setError(staffResult.error ?? "Failed to load staff.");
    } else {
      setStaff(staffResult.data ?? []);
    }
    if (!invResult.success) {
      // non-fatal — show empty invitations
      setInvitations([]);
    } else {
      setInvitations(invResult.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // Filtered staff (client-side search)
  // ---------------------------------------------------------------------------

  const filteredStaff = staff.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  });

  // ---------------------------------------------------------------------------
  // Invite staff
  // ---------------------------------------------------------------------------

  async function handleInvite(): Promise<void> {
    if (!inviteForm.email || !inviteForm.department || !inviteForm.role) {
      toast.error("Please fill in all fields.");
      return;
    }
    setInviteLoading(true);
    const result = await inviteStaff({
      email: inviteForm.email,
      department: inviteForm.department,
      role: inviteForm.role,
    });
    setInviteLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to send invitation.");
      return;
    }
    toast.success(`Invitation sent to ${inviteForm.email}`);
    setInviteOpen(false);
    setInviteForm({ email: "", department: "", role: "staff" });
    loadData();
  }

  // ---------------------------------------------------------------------------
  // Deactivate / Reactivate
  // ---------------------------------------------------------------------------

  async function handleDeactivate(): Promise<void> {
    if (!deactivateTarget) return;
    setDeactivateLoading(true);
    const result = await deactivateStaff(deactivateTarget.id);
    setDeactivateLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to deactivate staff member.");
      setDeactivateTarget(null);
      return;
    }
    toast.success(`${deactivateTarget.name} has been deactivated.`);
    setDeactivateTarget(null);
    // Optimistic update
    setStaff((prev) =>
      prev.map((s) =>
        s.id === deactivateTarget.id ? { ...s, isActive: false } : s
      )
    );
  }

  async function handleReactivate(member: StaffMember): Promise<void> {
    setMutatingIds((prev) => new Set(prev).add(member.id));
    const result = await reactivateStaff(member.id);
    setMutatingIds((prev) => {
      const next = new Set(prev);
      next.delete(member.id);
      return next;
    });
    if (!result.success) {
      toast.error(result.error ?? "Failed to reactivate staff member.");
      return;
    }
    toast.success(`${member.name} has been reactivated.`);
    setStaff((prev) =>
      prev.map((s) => (s.id === member.id ? { ...s, isActive: true } : s))
    );
  }

  // ---------------------------------------------------------------------------
  // Change department
  // ---------------------------------------------------------------------------

  async function handleChangeDepartment(
    member: StaffMember,
    department: string
  ): Promise<void> {
    if (department === member.department) return;
    setMutatingIds((prev) => new Set(prev).add(member.id));
    const result = await updateStaffDepartment(member.id, department);
    setMutatingIds((prev) => {
      const next = new Set(prev);
      next.delete(member.id);
      return next;
    });
    if (!result.success) {
      toast.error(result.error ?? "Failed to update department.");
      return;
    }
    toast.success(
      `${member.name} moved to ${DEPARTMENT_LABELS[department] ?? department}.`
    );
    setStaff((prev) =>
      prev.map((s) => (s.id === member.id ? { ...s, department } : s))
    );
  }

  // ---------------------------------------------------------------------------
  // Revoke invitation
  // ---------------------------------------------------------------------------

  async function handleRevoke(): Promise<void> {
    if (!revokeTarget) return;
    setRevokeLoading(true);
    const result = await revokeInvitation(revokeTarget.id);
    setRevokeLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to revoke invitation.");
      setRevokeTarget(null);
      return;
    }
    toast.success(`Invitation to ${revokeTarget.email} revoked.`);
    setRevokeTarget(null);
    setInvitations((prev) =>
      prev.map((inv) =>
        inv.id === revokeTarget.id ? { ...inv, status: "revoked" } : inv
      )
    );
  }

  // ---------------------------------------------------------------------------
  // Resend invitation
  // ---------------------------------------------------------------------------

  async function handleResend(invitation: StaffInvitation): Promise<void> {
    setMutatingIds((prev) => new Set(prev).add(invitation.id));
    const result = await resendInvitation(invitation.id);
    setMutatingIds((prev) => {
      const next = new Set(prev);
      next.delete(invitation.id);
      return next;
    });
    if (!result.success) {
      toast.error(result.error ?? "Failed to resend invitation.");
      return;
    }
    toast.success(`Invitation resent to ${invitation.email}.`);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      <ManagerHeader
        userName={userName}
        userInitials={userInitials}
        onSignOut={handleSignOut}
      />

      <PageContainer>
        <PageHeader
          title="Staff"
          subtitle="Manage your team, invitations, and department assignments"
          action={
            <Button
              onClick={() => setInviteOpen(true)}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Invite Staff
            </Button>
          }
        />

        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <X className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button
              onClick={loadData}
              className="ml-auto flex items-center gap-1.5 text-destructive/70 hover:text-destructive transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        <Tabs defaultValue="staff">
          <TabsList className="mb-6">
            <TabsTrigger value="staff">Active Staff</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
          </TabsList>

          {/* ------------------------------------------------------------------ */}
          {/* Active Staff Tab                                                    */}
          {/* ------------------------------------------------------------------ */}
          <TabsContent value="staff">
            {/* Search */}
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="glass-card-dark rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-medium">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <StaffSkeletonRows />
                    ) : filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <EmptyState
                            iconName={search ? "search" : "users"}
                            title={
                              search
                                ? "No staff match your search"
                                : "No staff members yet"
                            }
                            description={
                              search
                                ? "Try adjusting your search query."
                                : "Invite your first team member to get started."
                            }
                            action={
                              !search
                                ? {
                                    label: "Invite Staff",
                                    onClick: () => setInviteOpen(true),
                                  }
                                : undefined
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((member) => {
                        const isMutating = mutatingIds.has(member.id);
                        return (
                          <tr
                            key={member.id}
                            className={`border-b border-border/20 last:border-0 transition-opacity ${
                              !member.isActive ? "opacity-50" : ""
                            }`}
                          >
                            {/* Name + Avatar */}
                            <td className="px-4 py-3">
                              <StaffAvatar
                                name={member.name}
                                size="md"
                                showName
                              />
                            </td>

                            {/* Email */}
                            <td className="px-4 py-3 text-muted-foreground">
                              {member.email}
                            </td>

                            {/* Department */}
                            <td className="px-4 py-3">
                              <span className="text-foreground/80">
                                {DEPARTMENT_LABELS[member.department] ??
                                  member.department}
                              </span>
                            </td>

                            {/* Role */}
                            <td className="px-4 py-3 text-muted-foreground">
                              {roleLabel(member.role)}
                            </td>

                            {/* Status indicator */}
                            <td className="px-4 py-3">
                              {member.isActive ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_theme(colors.emerald.400)]" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                  Inactive
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-right">
                              {isMutating ? (
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />
                              ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-secondary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    aria-label={`Actions for ${member.name}`}
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    side="bottom"
                                  >
                                    <DropdownMenuLabel>
                                      {member.name}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    {/* Change Department submenu */}
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>
                                        Change Department
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent>
                                        {Object.entries(DEPARTMENT_LABELS).map(
                                          ([key, label]) => (
                                            <DropdownMenuItem
                                              key={key}
                                              onClick={() =>
                                                handleChangeDepartment(
                                                  member,
                                                  key
                                                )
                                              }
                                              className={
                                                member.department === key
                                                  ? "text-[#9B7340]"
                                                  : ""
                                              }
                                            >
                                              {label}
                                            </DropdownMenuItem>
                                          )
                                        )}
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>

                                    <DropdownMenuSeparator />

                                    {/* Deactivate / Reactivate */}
                                    {member.isActive ? (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          setDeactivateTarget(member)
                                        }
                                        className="text-destructive focus:text-destructive"
                                      >
                                        Deactivate
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleReactivate(member)
                                        }
                                        className="text-emerald-400 focus:text-emerald-400"
                                      >
                                        Reactivate
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ------------------------------------------------------------------ */}
          {/* Invitations Tab                                                     */}
          {/* ------------------------------------------------------------------ */}
          <TabsContent value="invitations">
            <div className="glass-card-dark rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-medium">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Sent
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <InvitationSkeletonRows />
                    ) : invitations.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <EmptyState
                            iconName="inbox"
                            title="No invitations yet"
                            description="Invite staff members to join your hotel team."
                            action={{
                              label: "Invite Staff",
                              onClick: () => setInviteOpen(true),
                            }}
                          />
                        </td>
                      </tr>
                    ) : (
                      invitations.map((inv) => {
                        const isMutating = mutatingIds.has(inv.id);
                        const isPending = inv.status === "pending";
                        return (
                          <tr
                            key={inv.id}
                            className="border-b border-border/20 last:border-0"
                          >
                            {/* Email */}
                            <td className="px-4 py-3 font-medium">
                              {inv.email}
                            </td>

                            {/* Department */}
                            <td className="px-4 py-3 text-muted-foreground">
                              {inv.department
                                ? (DEPARTMENT_LABELS[inv.department] ??
                                  inv.department)
                                : "—"}
                            </td>

                            {/* Role */}
                            <td className="px-4 py-3 text-muted-foreground">
                              {roleLabel(inv.role)}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              <InvitationStatusBadge status={inv.status} />
                            </td>

                            {/* Sent date */}
                            <td className="px-4 py-3 text-muted-foreground">
                              {formatDate(inv.createdAt)}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-right">
                              {isMutating ? (
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />
                              ) : isPending ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-secondary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    aria-label={`Actions for invitation to ${inv.email}`}
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    side="bottom"
                                  >
                                    <DropdownMenuItem
                                      onClick={() => handleResend(inv)}
                                    >
                                      <RefreshCw className="w-4 h-4 mr-2" />
                                      Resend
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setRevokeTarget(inv)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Revoke
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PageContainer>

      {/* -------------------------------------------------------------------- */}
      {/* Invite Staff Dialog                                                   */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Email */}
            <div className="grid gap-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="staff@example.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((prev) => ({ ...prev, email: e.target.value }))
                }
                autoComplete="off"
              />
            </div>

            {/* Department */}
            <div className="grid gap-1.5">
              <Label htmlFor="invite-department">Department</Label>
              <Select
                value={inviteForm.department}
                onValueChange={(value) =>
                  setInviteForm((prev) => ({ ...prev, department: value ?? "" }))
                }
              >
                <SelectTrigger id="invite-department" className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEPARTMENT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            <div className="grid gap-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) =>
                  setInviteForm((prev) => ({ ...prev, role: value ?? "" }))
                }
              >
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="front_desk">Front Desk</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteOpen(false)}
              disabled={inviteLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviteLoading}>
              {inviteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/* Deactivate Confirmation AlertDialog                                   */}
      {/* -------------------------------------------------------------------- */}
      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate staff member?</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateTarget ? (
                <>
                  <strong>{deactivateTarget.name}</strong> will lose access to
                  the staff portal immediately. You can reactivate them at any
                  time.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeactivateTarget(null)}
              disabled={deactivateLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivateLoading}
            >
              {deactivateLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* -------------------------------------------------------------------- */}
      {/* Revoke Confirmation AlertDialog                                       */}
      {/* -------------------------------------------------------------------- */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget ? (
                <>
                  The invitation sent to <strong>{revokeTarget.email}</strong>{" "}
                  will be revoked and the link will no longer work.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setRevokeTarget(null)}
              disabled={revokeLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleRevoke}
              disabled={revokeLoading}
            >
              {revokeLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
