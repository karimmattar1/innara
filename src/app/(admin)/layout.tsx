export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="min-h-screen bg-background dark">
      {/* Admin portal: desktop, dark theme, sidebar layout */}
      <div className="flex">
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-sidebar">
          {/* Sidebar placeholder */}
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
