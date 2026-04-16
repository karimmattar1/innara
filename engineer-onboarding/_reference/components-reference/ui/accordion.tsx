import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

const Accordion = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { type?: string; collapsible?: boolean }) => <div {...props}>{children}</div>
const AccordionItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(({ className, ...props }, ref) => <div ref={ref} className={cn("border-b", className)} {...props} />)
AccordionItem.displayName = "AccordionItem"
const AccordionTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, children, ...props }, ref) => (
  <h3 className="flex"><button ref={ref} className={cn("flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180", className)} {...props}>{children}<ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" /></button></h3>
))
AccordionTrigger.displayName = "AccordionTrigger"
const AccordionContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("overflow-hidden text-sm", className)} {...props}><div className="pb-4 pt-0">{children}</div></div>
))
AccordionContent.displayName = "AccordionContent"
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
