import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ icon: Icon, title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[#9B7340]/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#9B7340]" />
          </div>
        )}
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}
