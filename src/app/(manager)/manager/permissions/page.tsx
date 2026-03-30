"use client";

import { useRouter } from "next/navigation";
import { Shield, Check, X, ChevronRight, Users, Star, Lock } from "lucide-react";
import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const ROLES = ["Guest", "Staff", "Front Desk", "Manager"] as const;

type Role = (typeof ROLES)[number];

interface Permission {
  readonly name: string;
  readonly guest: boolean;
  readonly staff: boolean;
  readonly frontDesk: boolean;
  readonly manager: boolean;
}

const PERMISSIONS: readonly Permission[] = [
  { name: "View own requests",      guest: true,  staff: true,  frontDesk: true,  manager: true  },
  { name: "Create requests",        guest: true,  staff: false, frontDesk: true,  manager: true  },
  { name: "View all requests",      guest: false, staff: true,  frontDesk: true,  manager: true  },
  { name: "Claim requests",         guest: false, staff: true,  frontDesk: true,  manager: true  },
  { name: "Update request status",  guest: false, staff: true,  frontDesk: true,  manager: true  },
  { name: "Assign staff to requests", guest: false, staff: false, frontDesk: true, manager: true },
  { name: "View analytics",         guest: false, staff: false, frontDesk: false, manager: true  },
  { name: "Manage menu & catalog",  guest: false, staff: false, frontDesk: false, manager: true  },
  { name: "Manage staff & invitations", guest: false, staff: false, frontDesk: false, manager: true },
  { name: "Manage billing",         guest: false, staff: false, frontDesk: false, manager: true  },
  { name: "Manage branding",        guest: false, staff: false, frontDesk: false, manager: true  },
  { name: "Configure SLA",          guest: false, staff: false, frontDesk: false, manager: true  },
  { name: "View audit logs",        guest: false, staff: false, frontDesk: false, manager: true  },
] as const;

interface RoleDescription {
  readonly role: Role;
  readonly icon: React.ElementType;
  readonly color: string;
  readonly description: string;
  readonly badge: string;
}

const ROLE_DESCRIPTIONS: readonly RoleDescription[] = [
  {
    role: "Guest",
    icon: Star,
    color: "text-blue-400",
    badge: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    description:
      "Hotel guests who submit and track their own service requests. Cannot see other guests' data or interact with staff tooling.",
  },
  {
    role: "Staff",
    icon: Users,
    color: "text-emerald-400",
    badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    description:
      "Operational staff who claim and fulfill requests. Can view all open requests and update status, but cannot assign work to others or access management features.",
  },
  {
    role: "Front Desk",
    icon: Shield,
    color: "text-amber-400",
    badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    description:
      "Front desk agents who coordinate operations. Can create requests on behalf of guests, assign staff, and manage the full request lifecycle.",
  },
  {
    role: "Manager",
    icon: Lock,
    color: "text-[#9B7340]",
    badge: "bg-[#9B7340]/10 border-[#9B7340]/20 text-[#9B7340]",
    description:
      "Full administrative access. Controls hotel configuration, billing, staff management, branding, SLA rules, and has access to all analytics and audit logs.",
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPermissionValue(permission: Permission, role: Role): boolean {
  const map: Record<Role, boolean> = {
    Guest: permission.guest,
    Staff: permission.staff,
    "Front Desk": permission.frontDesk,
    Manager: permission.manager,
  };
  return map[role];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PermissionCell({ allowed }: { allowed: boolean }): React.ReactElement {
  if (allowed) {
    return (
      <div
        className="flex items-center justify-center"
        aria-label="Allowed"
        title="Allowed"
      >
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15">
          <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
        </span>
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center"
      aria-label="Not allowed"
      title="Not allowed"
    >
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10">
        <X className="w-3.5 h-3.5 text-red-400/70" strokeWidth={2.5} />
      </span>
    </div>
  );
}

function RoleHeader({ role }: { role: Role }): React.ReactElement {
  const desc = ROLE_DESCRIPTIONS.find((d) => d.role === role)!;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${desc.badge}`}
    >
      {role}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PermissionsPage(): React.ReactElement {
  const router = useRouter();

  const handleSignOut = async (): Promise<void> => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/staff/login");
  };

  return (
    <>
      <ManagerHeader onSignOut={() => void handleSignOut()} />

      <PageContainer>
        <PageHeader
          title="Permissions"
          subtitle="Role-based access control overview for your hotel"
          backTo="/manager"
          action={
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                <Shield className="w-3.5 h-3.5" />
                Read-only — enforced via RLS
              </span>
            </div>
          }
        />

        {/* ------------------------------------------------------------------ */}
        {/* Role description cards                                              */}
        {/* ------------------------------------------------------------------ */}
        <section aria-labelledby="roles-heading" className="mb-8">
          <h2
            id="roles-heading"
            className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4"
          >
            Role Definitions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {ROLE_DESCRIPTIONS.map(({ role, icon: Icon, color, badge, description }) => (
              <article
                key={role}
                className="glass-card-dark rounded-2xl p-5 flex flex-col gap-3"
                aria-label={`${role} role`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 ${color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${badge}`}
                  >
                    {role}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Permissions matrix                                                  */}
        {/* ------------------------------------------------------------------ */}
        <section aria-labelledby="matrix-heading" className="mb-8">
          <h2
            id="matrix-heading"
            className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4"
          >
            Permissions Matrix
          </h2>

          {/* Desktop table */}
          <div className="glass-card-dark rounded-2xl overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table
                className="w-full"
                aria-label="Role permissions matrix"
              >
                <thead>
                  <tr className="border-b border-white/10">
                    <th
                      scope="col"
                      className="text-left px-6 py-4 text-sm font-semibold text-foreground w-1/2"
                    >
                      Permission
                    </th>
                    {ROLES.map((role) => (
                      <th
                        key={role}
                        scope="col"
                        className="px-4 py-4 text-center text-sm font-medium"
                      >
                        <RoleHeader role={role} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {PERMISSIONS.map((permission, index) => (
                    <tr
                      key={permission.name}
                      className={index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"}
                    >
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">
                        {permission.name}
                      </td>
                      {ROLES.map((role) => (
                        <td key={role} className="px-4 py-3.5">
                          <PermissionCell
                            allowed={getPermissionValue(permission, role)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: stacked cards per permission */}
          <div className="sm:hidden space-y-3">
            {PERMISSIONS.map((permission) => (
              <div
                key={permission.name}
                className="glass-card-dark rounded-2xl p-4"
              >
                <p className="text-sm font-semibold mb-3">{permission.name}</p>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((role) => {
                    const allowed = getPermissionValue(permission, role);
                    return (
                      <div
                        key={role}
                        className="flex items-center gap-2"
                      >
                        {allowed ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" strokeWidth={2.5} />
                        ) : (
                          <X className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0" strokeWidth={2.5} />
                        )}
                        <span className="text-xs text-muted-foreground">{role}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Staff management CTA                                               */}
        {/* ------------------------------------------------------------------ */}
        <section aria-labelledby="staff-cta-heading">
          <div className="glass-card-dark rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#9B7340]/15 text-[#9B7340] flex-shrink-0 mt-0.5">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h2
                  id="staff-cta-heading"
                  className="text-sm font-semibold mb-1"
                >
                  Change a staff member&apos;s role?
                </h2>
                <p className="text-sm text-muted-foreground">
                  To change a staff member&apos;s role, go to Staff Management where you can
                  update roles, send invitations, and manage access.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="flex-shrink-0 gap-2"
              onClick={() => router.push("/manager/staff")}
            >
              Staff Management
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </PageContainer>
    </>
  );
}
