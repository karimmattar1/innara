"use client";

import { AdminHeader } from "@/components/innara/AdminHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";

export default function AdminDashboard(): React.ReactElement {
  return (
    <>
      <AdminHeader />
      <PageContainer>
        <PageHeader
          title="Admin Dashboard"
          subtitle="Platform management and tenant oversight"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card-dark p-6 rounded-2xl">
            <p className="text-sm text-muted-foreground">Active Tenants</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
          <div className="glass-card-dark p-6 rounded-2xl">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
          <div className="glass-card-dark p-6 rounded-2xl">
            <p className="text-sm text-muted-foreground">MRR</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
          <div className="glass-card-dark p-6 rounded-2xl">
            <p className="text-sm text-muted-foreground">System Health</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
