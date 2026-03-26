export default function GuestLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="min-h-screen bg-background">
      {/* Guest portal: mobile-first, light theme */}
      <main className="mx-auto max-w-md">{children}</main>
    </div>
  );
}
