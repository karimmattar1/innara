"use client";

import { StaffHeader } from "@/components/innara/StaffHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";

export default function StaffDashboard(): React.ReactElement {
  return (
    <>
      <StaffHeader />
      <PageContainer>
        <PageHeader
          title="Staff Dashboard"
          subtitle="Manage your tasks and requests"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card-dark p-6 rounded-2xl">
            <p className="text-sm text-muted-foreground">Active Requests</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
          <div className="glass-card-dark p-6 rounded-2xl">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
          <div className="glass-card-dark p-6 rounded-2xl">
            <p className="text-sm text-muted-foreground">Completed Today</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
          <div className="glass-card-dark p-6 rounded-2xl">
            <p className="text-sm text-muted-foreground">Avg Response</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
