"use client";

import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";

export default function ManagerDashboard(): React.ReactElement {
  return (
    <>
      <ManagerHeader />
      <PageContainer>
        <PageHeader
          title="Manager Dashboard"
          subtitle="Operations overview and analytics"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card-dark p-6 rounded-2xl">
            <p className="text-sm text-muted-foreground">Total Requests</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
          <div className="glass-card-dark p-6 rounded-2xl">
            <p className="text-sm text-muted-foreground">Guest Satisfaction</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
          <div className="glass-card-dark p-6 rounded-2xl">
            <p className="text-sm text-muted-foreground">Staff Online</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
          <div className="glass-card-dark p-6 rounded-2xl">
            <p className="text-sm text-muted-foreground">Revenue Today</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
