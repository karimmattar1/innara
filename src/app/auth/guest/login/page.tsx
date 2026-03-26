export default function GuestLoginPage(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Guest Login</h1>
        <p className="text-muted-foreground text-center">
          Enter your booking details to continue.
        </p>
        {/* Auth form will be implemented in Phase 1 */}
      </div>
    </div>
  );
}
