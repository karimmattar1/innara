import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function ManagerLoading(): React.ReactElement {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

export default function ManagerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="min-h-screen bg-background dark">
      <Suspense fallback={<ManagerLoading />}>{children}</Suspense>
    </div>
  );
}
