import * as React from "react"
import { cn } from "@/lib/utils"
import { toggleVariants } from "./toggle"
import type { VariantProps } from "class-variance-authority"

const ToggleGroupContext = React.createContext<{ variant?: string; size?: string }>({})

const ToggleGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof toggleVariants> & { type?: "single" | "multiple" }>(
  ({ className, variant, size, ...props }, ref) => (
    <ToggleGroupContext.Provider value={{ variant: variant || "default", size: size || "default" }}>
      <div ref={ref} className={cn("flex items-center justify-center gap-1", className)} {...props} />
    </ToggleGroupContext.Provider>
  )
)
ToggleGroup.displayName = "ToggleGroup"

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof toggleVariants> & { value: string }>(
  ({ className, variant, size, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext)
    return <button ref={ref} className={cn(toggleVariants({ variant: (variant || context.variant) as any, size: (size || context.size) as any }), className)} {...props} />
  }
)
ToggleGroupItem.displayName = "ToggleGroupItem"
export { ToggleGroup, ToggleGroupItem }
