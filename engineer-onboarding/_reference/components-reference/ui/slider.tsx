import * as React from "react"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} type="range" className={cn("w-full h-2 rounded-lg appearance-none cursor-pointer bg-primary/20", className)} {...props} />
  )
)
Slider.displayName = "Slider"

export { Slider }
