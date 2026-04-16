import { cn } from "@/lib/utils"

interface LoadingScreenProps {
  className?: string
  message?: string
}

export function LoadingScreen({ className, message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className={cn("flex min-h-screen items-center justify-center", className)}>
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
