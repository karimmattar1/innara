"use client";

import { useState, useCallback } from "react";
import {
  Search,
  Users,
  Building2,
  Shield,
  UserX,
  UserCheck,
  Loader2,
  XCircle,
} from "lucide-react";
import { AdminHeader } from "@/components/innara/AdminHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import {
  searchUsers,
  deactivateUser,
  reactivateUser,
  type AdminUser,
} from "@/app/actions/admin-users";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------

const ROLE_STYLES: Record<string, string> = {
  super_admin: "text-purple-400 bg-purple-500/10",
  manager: "text-[#9B7340] bg-[#9B7340]/10",
  front_desk: "text-blue-400 bg-blue-500/10",
  staff: "text-muted-foreground bg-secondary/50",
  guest: "text-emerald-400 bg-emerald-500/10",
};

function RoleBadge({ role }: { role: string | null }): React.ReactElement {
  const label = role
    ? role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "No Role";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium",
        ROLE_STYLES[role ?? ""] ?? "text-muted-foreground/50 bg-secondary/30",
      )}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminUsersPage(): React.ReactElement {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const pageSize = 20;

  const doSearch = useCallback(
    async (pg: number = 1) => {
      if (!query.trim()) return;
      setLoading(true);
      setError(null);
      const result = await searchUsers(query.trim(), pg, pageSize);
      if (result.success && result.data) {
        setUsers(result.data.users);
        setTotal(result.data.total);
        setPage(pg);
      } else {
        setError(result.error ?? "Search failed.");
        setUsers([]);
      }
      setSearched(true);
      setLoading(false);
    },
    [query],
  );

  async function handleToggleUser(user: AdminUser): Promise<void> {
    setActionPending(user.id);
    const result = user.isActive
      ? await deactivateUser(user.id)
      : await reactivateUser(user.id);

    if (result.success) {
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: !u.isActive } : u,
        ),
      );
    } else {
      setError(result.error ?? "Action failed.");
    }
    setActionPending(null);
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <AdminHeader />
      <PageContainer>
        <PageHeader
          title="User Management"
          subtitle="Search and manage users across all hotels"
        />

        {/* Search bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch(1)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-secondary/30 border border-border/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#9B7340]/50 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            onClick={() => doSearch(1)}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#9B7340] text-white rounded-xl hover:bg-[#b8924f] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {!searched ? (
          <div className="glass-card-dark p-12 rounded-2xl text-center">
            <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Search for users by email or name to get started.
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#9B7340]" />
          </div>
        ) : users.length === 0 ? (
          <div className="glass-card-dark p-12 rounded-2xl text-center">
            <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No users found for &ldquo;{query}&rdquo;.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              {total} result{total !== 1 ? "s" : ""} found
            </p>
            <div className="glass-card-dark rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/20">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                      User
                    </th>
                    <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                      Role
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                      Hotel
                    </th>
                    <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                      Status
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/10 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {user.fullName ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground/60">
                            {user.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-5 py-4">
                        {user.hotelName ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground/40" />
                            <span className="text-sm text-muted-foreground">
                              {user.hotelName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/40 italic">
                            No hotel
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                            user.isActive
                              ? "text-emerald-400 bg-emerald-500/10"
                              : "text-red-400 bg-red-500/10",
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              user.isActive ? "bg-emerald-400" : "bg-red-400",
                            )}
                          />
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {user.role !== "super_admin" && (
                          <button
                            onClick={() => handleToggleUser(user)}
                            disabled={actionPending === user.id}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50",
                              user.isActive
                                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
                            )}
                          >
                            {actionPending === user.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : user.isActive ? (
                              <UserX className="w-3 h-3" />
                            ) : (
                              <UserCheck className="w-3 h-3" />
                            )}
                            {user.isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => doSearch(page - 1)}
                  disabled={page <= 1 || loading}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors disabled:opacity-30"
                >
                  Previous
                </button>
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => doSearch(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}
