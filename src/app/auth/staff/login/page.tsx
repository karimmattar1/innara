export default function StaffLoginPage(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 dark bg-background">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center text-foreground">
          Staff Login
        </h1>
        <p className="text-muted-foreground text-center">
          Sign in to access your dashboard.
        </p>
        {/* Staff auth form will be implemented in Phase 1 */}
      </div>
    </div>
  );
}
